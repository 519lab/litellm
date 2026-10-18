"""
OTLP span tracing hook for LiteLLM proxy.

Emits one OpenTelemetry span per LLM request with:
  - llm.model
  - llm.prompt_tokens, llm.completion_tokens, llm.total_tokens
  - llm.cached_prompt_tokens (usage.prompt_tokens_details.cached_tokens)
  - llm.ttft_ms  (completion_start_time - start_time)
  - llm.tpot_ms / llm.tps  (decode window only: end_time - completion_start_time)
  - llamacpp.prompt_tps, llamacpp.decode_tps, llamacpp.tpot_ms, llamacpp.cache_n
    and llamacpp.speculative_acceptance_rate, from the `timings` object
    llama-server puts in non-streaming response bodies (it sends no
    performance headers; streamed responses keep only the usage fields)
  - cache.hit    (True/False)
  - error        (True/False, with exception event on failure)

Usage in config.yaml:
    litellm_settings:
      callbacks:
        - litellm.proxy.hooks.otlp_tracer.proxy_handler_instance

    environment_variables:
      OTLP_ENDPOINT: "http://localhost:4317"   # default

The exporter is built on the first traced request, so importing the module opens
no connection. The hook exports to any OTLP/gRPC receiver (Grafana Alloy, Jaeger,
Phoenix, Tempo).
If the OTLP endpoint is unreachable, spans are dropped silently — the hook never
raises into the request path.
"""

import os
import time
from datetime import datetime
from typing import TYPE_CHECKING, Callable, TypedDict

from litellm._logging import verbose_proxy_logger
from litellm.integrations.custom_logger import CustomLogger

if TYPE_CHECKING:
    from opentelemetry.trace import Span, Tracer

try:
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
_STALE_SPAN_TTL_S = 300.0


class _SpanEntry(TypedDict):
    span: "Span"
    t0: float


def _parse_float(val: object) -> float | None:
    if isinstance(val, bool) or not isinstance(val, (int, float, str)):
        return None
    try:
        return float(val)
    except ValueError:
        return None


def _elapsed_ms(start: object, end: object) -> float | None:
    if not isinstance(start, datetime) or not isinstance(end, datetime):
        return None
    return (end - start).total_seconds() * 1000


def _latency_attributes(
    start_time: object, end_time: object, first_token_time: object, completion_tokens: int
) -> dict[str, float]:
    ttft_ms = _elapsed_ms(start_time, first_token_time)
    decode_ms = _elapsed_ms(first_token_time, end_time)
    if ttft_ms is None or decode_ms is None or decode_ms <= 0:
        return {}
    ttft = {"llm.ttft_ms": round(ttft_ms, 2)}
    if completion_tokens < 2:
        return ttft
    decode_tokens = completion_tokens - 1
    return {
        **ttft,
        "llm.tpot_ms": round(decode_ms / decode_tokens, 2),
        "llm.tps": round(decode_tokens * 1000 / decode_ms, 2),
    }


def _llamacpp_timing_attributes(timings: object) -> dict[str, float]:
    if not isinstance(timings, dict):
        return {}
    fields = {
        "llamacpp.prompt_tps": timings.get("prompt_per_second"),
        "llamacpp.decode_tps": timings.get("predicted_per_second"),
        "llamacpp.tpot_ms": timings.get("predicted_per_token_ms"),
        "llamacpp.cache_n": timings.get("cache_n"),
    }
    parsed = {name: _parse_float(value) for name, value in fields.items()}
    draft_n = _parse_float(timings.get("draft_n"))
    accepted = _parse_float(timings.get("draft_n_accepted"))
    acceptance = (
        {"llamacpp.speculative_acceptance_rate": round(accepted / draft_n, 4)}
        if draft_n and accepted is not None
        else {}
    )
    return {**{name: round(value, 2) for name, value in parsed.items() if value is not None}, **acceptance}


def _cached_prompt_tokens(usage: object) -> int | None:
    cached = getattr(getattr(usage, "prompt_tokens_details", None), "cached_tokens", None)
    return cached if isinstance(cached, int) else None


class OTLPTracerHook(CustomLogger):
    """
    CustomLogger that wraps each LiteLLM call in an OpenTelemetry span.

    Keeps in-flight state in a plain dict keyed by litellm_call_id. The
    pre-call hook opens the span; success/failure hooks close it. This means
    the span duration equals the full LLM round-trip, not just the Python
    processing time.
    """

    def __init__(self, tracer_factory: "Callable[[], Tracer | None] | None" = None) -> None:
        super().__init__()
        self._active: dict[str, _SpanEntry] = {}  # mutable-ok: in-flight span registry, keyed by litellm_call_id
        self._tracer_factory = tracer_factory or _otlp_tracer_from_env
        self._tracer_resolved = False
        self._resolved_tracer: "Tracer | None" = None

    @property
    def _tracer(self) -> "Tracer | None":
        if not self._tracer_resolved:
            self._resolved_tracer = self._tracer_factory()
            self._tracer_resolved = True
        return self._resolved_tracer

    # -- Pre-call ---------------------------------------------------------

    async def async_pre_call_hook(
        self,
        user_api_key_dict: object,
        cache: object,
        data: dict[str, object],
        call_type: str,
    ) -> dict[str, object]:
        if self._tracer is None:
            return data
        call_id = data.get("litellm_call_id")
        if not isinstance(call_id, str):
            return data
        self._sweep_stale_spans()
        span = self._tracer.start_span(_SPAN_NAME)
        span.set_attribute("llm.model", str(data.get("model", "")))
        span.set_attribute("cache.hit", False)
        self._active[call_id] = {"span": span, "t0": time.monotonic()}
        return data

    # -- Success ----------------------------------------------------------

    async def async_log_success_event(
        self,
        kwargs: dict[str, object],
        response_obj: object,
        start_time: object,
        end_time: object,
    ) -> None:
        self._close_span(kwargs, response_obj=response_obj, error=False, start_time=start_time, end_time=end_time)

    # -- Failure ----------------------------------------------------------

    async def async_log_failure_event(
        self,
        kwargs: dict[str, object],
        response_obj: object,
        start_time: object,
        end_time: object,
    ) -> None:
        self._close_span(kwargs, response_obj=response_obj, error=True, start_time=start_time, end_time=end_time)

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

    def _close_span(
        self,
        kwargs: dict[str, object],
        *,
        response_obj: object,
        error: bool,
        start_time: object = None,
        end_time: object = None,
    ) -> None:
        if self._tracer is None:
            return
        call_id = kwargs.get("litellm_call_id")
        if not isinstance(call_id, str):
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

            cached_prompt_tokens = _cached_prompt_tokens(usage)
            if cached_prompt_tokens is not None:
                span.set_attribute("llm.cached_prompt_tokens", cached_prompt_tokens)
            span.set_attributes(
                _latency_attributes(start_time, end_time, kwargs.get("completion_start_time"), completion_tokens)
            )
            span.set_attributes(_llamacpp_timing_attributes(getattr(response_obj, "timings", None)))

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


def _otlp_tracer_from_env() -> "Tracer | None":
    if not _OTEL_AVAILABLE:
        verbose_proxy_logger.warning(
            "OTLPTracerHook: opentelemetry-sdk / opentelemetry-exporter-otlp-proto-grpc "
            "not installed. Install them to enable tracing. Hook registered but inactive."
        )
        return None
    endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    provider = TracerProvider(resource=Resource.create({"service.name": "litellm-proxy"}))
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    verbose_proxy_logger.info("OTLPTracerHook: exporting spans to %s", endpoint)
    return provider.get_tracer(_INSTRUMENTATION_NAME)


proxy_handler_instance = OTLPTracerHook()
