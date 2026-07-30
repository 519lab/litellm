"""
OTLP span tracing hook for LiteLLM proxy.

Emits one OpenTelemetry span per LLM request with:
  - llm.model
  - llm.prompt_tokens, llm.completion_tokens, llm.total_tokens
  - llm.tpot_ms  (time-per-output-token = elapsed / completion_tokens)
  - llm.tps      (tokens per second, computed from completion_tokens / elapsed)
  - llamacpp.tps (from x-llamacpp-tokens-per-second response header)
  - llamacpp.speculative_acceptance_rate  (from x-llamacpp-draft-n-accepted header)
  - cache.hit    (True/False)
  - error        (True/False, with exception event on failure)

Usage in config.yaml:
    litellm_settings:
      callbacks:
        - litellm.proxy.hooks.otlp_tracer.make_hook

    environment_variables:
      OTLP_ENDPOINT: "http://localhost:4317"   # default

The hook exports to any OTLP/gRPC receiver (Grafana Alloy, Jaeger, Phoenix, Tempo).
If the OTLP endpoint is unreachable, spans are dropped silently — the hook never
raises into the request path.
"""

import os
import time
from typing import Any, Optional

from litellm._logging import verbose_proxy_logger
from litellm.integrations.custom_logger import CustomLogger

try:
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.trace import Status, StatusCode

    _OTEL_AVAILABLE = True
except ImportError:
    _OTEL_AVAILABLE = False


_INSTRUMENTATION_NAME = "litellm-proxy"
_SPAN_NAME = "llm.completion"
_STALE_SPAN_TTL_S = 300.0  # spans older than 5 minutes are swept as lost


def _parse_float(val: Any) -> Optional[float]:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


class OTLPTracerHook(CustomLogger):
    """
    CustomLogger that wraps each LiteLLM call in an OpenTelemetry span.

    Keeps in-flight state in a plain dict keyed by litellm_call_id. The
    pre-call hook opens the span; success/failure hooks close it. This means
    the span duration equals the full LLM round-trip, not just the Python
    processing time.
    """

    def __init__(self, otlp_endpoint: str = "http://localhost:4317", _tracer: Any = None) -> None:
        super().__init__()
        self._active: dict[str, Any] = {}  # mutable-ok: in-flight span registry, keyed by litellm_call_id

        if _tracer is not None:
            self._tracer: Any = _tracer
            return

        if not _OTEL_AVAILABLE:
            verbose_proxy_logger.warning(
                "OTLPTracerHook: opentelemetry-sdk / opentelemetry-exporter-otlp-proto-grpc "
                "not installed. Install them to enable tracing. Hook registered but inactive."
            )
            self._tracer = None
            return

        resource = Resource.create({"service.name": "litellm-proxy"})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        self._tracer = provider.get_tracer(_INSTRUMENTATION_NAME)

        verbose_proxy_logger.info(
            "OTLPTracerHook: exporting spans to %s", otlp_endpoint
        )

    # -- Pre-call ---------------------------------------------------------

    async def async_pre_call_hook(
        self,
        user_api_key_dict: Any,
        cache_obj: Any,
        data: dict,
        call_type: str,
    ) -> dict:
        if self._tracer is None:
            return data
        call_id = data.get("litellm_call_id")
        if not call_id:
            return data
        self._sweep_stale_spans()
        span = self._tracer.start_span(_SPAN_NAME)
        span.set_attribute("llm.model", data.get("model", ""))
        span.set_attribute("cache.hit", False)
        self._active[call_id] = {"span": span, "t0": time.monotonic()}
        return data

    # -- Success ----------------------------------------------------------

    async def async_log_success_event(
        self,
        kwargs: dict,
        response_obj: Any,
        start_time: Any,
        end_time: Any,
    ) -> None:
        self._close_span(kwargs, response_obj=response_obj, error=False)

    # -- Failure ----------------------------------------------------------

    async def async_log_failure_event(
        self,
        kwargs: dict,
        response_obj: Any,
        start_time: Any,
        end_time: Any,
    ) -> None:
        self._close_span(kwargs, response_obj=response_obj, error=True)

    # -- Internal ---------------------------------------------------------

    def _sweep_stale_spans(self) -> None:
        now = time.monotonic()
        stale = [cid for cid, e in self._active.items() if now - e["t0"] > _STALE_SPAN_TTL_S]
        for cid in stale:
            entry = self._active.pop(cid)
            verbose_proxy_logger.warning(
                "OTLPTracerHook: closing stale span for call_id=%s (age=%.0fs)",
                cid,
                now - entry["t0"],
            )
            try:
                entry["span"].set_attribute("error", True)
                entry["span"].set_status(Status(StatusCode.ERROR))
            finally:
                entry["span"].end()

    def _close_span(self, kwargs: dict, *, response_obj: Any, error: bool) -> None:
        if self._tracer is None:
            return
        call_id = kwargs.get("litellm_call_id")
        if not call_id:
            return
        entry = self._active.pop(call_id, None)
        if entry is None:
            return
        span = entry["span"]
        elapsed = time.monotonic() - entry["t0"]

        try:
            usage = getattr(response_obj, "usage", None)
            prompt_tokens: int = getattr(usage, "prompt_tokens", 0) or 0
            completion_tokens: int = getattr(usage, "completion_tokens", 0) or 0
            total_tokens: int = getattr(usage, "total_tokens", 0) or 0

            span.set_attribute("llm.prompt_tokens", prompt_tokens)
            span.set_attribute("llm.completion_tokens", completion_tokens)
            span.set_attribute("llm.total_tokens", total_tokens)
            span.set_attribute("llm.duration_ms", round(elapsed * 1000, 2))

            if completion_tokens > 0:
                tpot = elapsed * 1000 / completion_tokens
                tps = completion_tokens / elapsed if elapsed > 0 else 0.0
                span.set_attribute("llm.tpot_ms", round(tpot, 2))
                span.set_attribute("llm.tps", round(tps, 2))

            # llama.cpp response headers forwarded via response_obj
            hdrs: dict = getattr(response_obj, "_response_headers", None) or {}
            raw_tps = hdrs.get("x-llamacpp-tokens-per-second")
            if raw_tps is not None:
                v = _parse_float(raw_tps)
                if v is not None:
                    span.set_attribute("llamacpp.tps", round(v, 2))
            raw_acc = hdrs.get("x-llamacpp-draft-n-accepted")
            if raw_acc is not None:
                v = _parse_float(raw_acc)
                if v is not None:
                    span.set_attribute("llamacpp.speculative_acceptance_rate", round(v, 4))

            cache_hit = kwargs.get("cache_hit", False)
            span.set_attribute("cache.hit", bool(cache_hit))
            span.set_attribute("error", error)

            if error:
                span.set_status(Status(StatusCode.ERROR))
            else:
                span.set_status(Status(StatusCode.OK))
        except Exception as exc:
            verbose_proxy_logger.debug("OTLPTracerHook: error annotating span — %s", exc)
        finally:
            span.end()


def make_hook() -> OTLPTracerHook:
    endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    return OTLPTracerHook(otlp_endpoint=endpoint)


proxy_handler_instance = make_hook()
