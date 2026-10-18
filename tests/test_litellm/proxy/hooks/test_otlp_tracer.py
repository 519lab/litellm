"""
Unit tests for litellm.proxy.hooks.otlp_tracer.

Tests use the in-memory span exporter and inject it via the _tracer parameter
so no real OTLP receiver is required.
"""

import time
from datetime import datetime, timedelta

import pytest
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import StatusCode

from litellm.proxy.hooks.otlp_tracer import OTLPTracerHook, _parse_float, proxy_handler_instance


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_hook() -> tuple[OTLPTracerHook, InMemorySpanExporter]:
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    tracer = provider.get_tracer("test")
    hook = OTLPTracerHook(tracer_factory=lambda: tracer)
    return hook, exporter


def _fake_response(prompt: int = 10, completion: int = 20, total: int = 30, headers: dict | None = None):
    class Response:
        class usage:
            prompt_tokens = prompt
            completion_tokens = completion
            total_tokens = total
        _response_headers = headers or {}
    return Response()


# ---------------------------------------------------------------------------
# _parse_float
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("val,expected", [
    ("12.5", 12.5),
    (99, 99.0),
    ("bad", None),
    (None, None),
    ("0.0", 0.0),
    (0, 0.0),
])
def test_parse_float(val, expected):
    assert _parse_float(val) == expected


# ---------------------------------------------------------------------------
# No-OTel no-op path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_no_op_when_tracer_is_none():
    hook = OTLPTracerHook(tracer_factory=lambda: None)
    data = {"litellm_call_id": "id-x", "model": "m"}
    result = await hook.async_pre_call_hook(user_api_key_dict=None, cache=None, data=data, call_type="completion")
    assert result is data
    await hook.async_log_success_event({"litellm_call_id": "id-x"}, _fake_response(), None, None)
    assert "id-x" not in hook._active


# ---------------------------------------------------------------------------
# Missing call_id — span must be skipped
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pre_call_skips_when_no_call_id():
    hook, exporter = _make_hook()
    data = {"model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None, data=data, call_type="completion")
    assert hook._active == {}

    await hook.async_log_success_event({}, _fake_response(), None, None)
    assert exporter.get_finished_spans() == ()


# ---------------------------------------------------------------------------
# Pre-call hook
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pre_call_registers_span():
    hook, _ = _make_hook()
    data = {"litellm_call_id": "id-1", "model": "test-model"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None, data=data, call_type="completion")
    assert "id-1" in hook._active
    assert "span" in hook._active["id-1"]
    assert "t0" in hook._active["id-1"]


@pytest.mark.asyncio
async def test_pre_call_returns_data_unchanged():
    hook, _ = _make_hook()
    data = {"litellm_call_id": "id-2", "model": "m", "extra": "value"}
    result = await hook.async_pre_call_hook(user_api_key_dict=None, cache=None, data=data, call_type="completion")
    assert result["extra"] == "value"


# ---------------------------------------------------------------------------
# Success event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_success_emits_span_with_token_attributes():
    hook, exporter = _make_hook()
    call_id = "success-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")

    await hook.async_log_success_event(
        {"litellm_call_id": call_id, "cache_hit": False},
        _fake_response(10, 50, 60),
        None, None,
    )

    spans = exporter.get_finished_spans()
    assert len(spans) == 1
    attrs = spans[0].attributes
    assert attrs["llm.prompt_tokens"] == 10
    assert attrs["llm.completion_tokens"] == 50
    assert attrs["llm.total_tokens"] == 60
    assert attrs["error"] is False
    assert attrs["cache.hit"] is False


@pytest.mark.asyncio
async def test_success_cleans_up_active_state():
    hook, _ = _make_hook()
    call_id = "cleanup-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event({"litellm_call_id": call_id}, _fake_response(), None, None)
    assert call_id not in hook._active


@pytest.mark.asyncio
async def test_success_sets_cache_hit_attribute():
    hook, exporter = _make_hook()
    call_id = "cache-hit-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event(
        {"litellm_call_id": call_id, "cache_hit": True}, _fake_response(), None, None
    )
    assert exporter.get_finished_spans()[0].attributes["cache.hit"] is True


@pytest.mark.asyncio
async def test_success_sets_ok_status():
    hook, exporter = _make_hook()
    call_id = "ok-status-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event({"litellm_call_id": call_id}, _fake_response(), None, None)
    assert exporter.get_finished_spans()[0].status.status_code == StatusCode.OK


# ---------------------------------------------------------------------------
# llama.cpp timings, latency windows and prompt-cache reuse (#4)
# ---------------------------------------------------------------------------

_LLAMACPP_B11243_TIMINGS = {
    "cache_n": 5,
    "prompt_n": 9,
    "prompt_ms": 9.657,
    "prompt_per_token_ms": 1.073,
    "prompt_per_second": 931.9664492078285,
    "predicted_n": 14,
    "predicted_ms": 68.28,
    "predicted_per_token_ms": 5.252307692307692,
    "predicted_per_second": 190.3925014645577,
}


def _llamacpp_response(timings: dict | None, cached: int | None = None, completion: int = 14):
    class PromptTokensDetails:
        cached_tokens = cached

    class Usage:
        prompt_tokens = 14
        completion_tokens = completion
        total_tokens = 14 + completion
        prompt_tokens_details = PromptTokensDetails()

    class Response:
        usage = Usage()

    response = Response()
    if timings is not None:
        response.timings = timings
    return response


async def _span_attributes(response, kwargs: dict | None = None, start_time=None, end_time=None) -> dict:
    hook, exporter = _make_hook()
    call_id = "llamacpp-timings"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event({"litellm_call_id": call_id, **(kwargs or {})}, response, start_time, end_time)
    return dict(exporter.get_finished_spans()[0].attributes)


@pytest.mark.asyncio
async def test_llamacpp_timings_body_becomes_span_attributes():
    attrs = await _span_attributes(_llamacpp_response(_LLAMACPP_B11243_TIMINGS, cached=5))
    assert attrs["llamacpp.prompt_tps"] == pytest.approx(931.97)
    assert attrs["llamacpp.decode_tps"] == pytest.approx(190.39)
    assert attrs["llamacpp.tpot_ms"] == pytest.approx(5.25)
    assert attrs["llamacpp.cache_n"] == 5
    assert attrs["llm.cached_prompt_tokens"] == 5
    assert "llamacpp.speculative_acceptance_rate" not in attrs


@pytest.mark.asyncio
async def test_llamacpp_speculative_acceptance_rate_is_accepted_over_drafted():
    timings = {**_LLAMACPP_B11243_TIMINGS, "draft_n": 40, "draft_n_accepted": 30}
    attrs = await _span_attributes(_llamacpp_response(timings))
    assert attrs["llamacpp.speculative_acceptance_rate"] == pytest.approx(0.75)


@pytest.mark.asyncio
async def test_llamacpp_zero_accepted_drafts_record_zero_rate():
    timings = {**_LLAMACPP_B11243_TIMINGS, "draft_n": 12, "draft_n_accepted": 0}
    attrs = await _span_attributes(_llamacpp_response(timings))
    assert attrs["llamacpp.speculative_acceptance_rate"] == 0.0


@pytest.mark.asyncio
async def test_streamed_response_without_timings_still_reports_cache_reuse():
    attrs = await _span_attributes(_llamacpp_response(None, cached=11))
    assert attrs["llm.cached_prompt_tokens"] == 11
    assert not any(name.startswith("llamacpp.") for name in attrs)


@pytest.mark.asyncio
async def test_invented_llamacpp_headers_are_ignored():
    response = _llamacpp_response(None)
    response._response_headers = {"x-llamacpp-tokens-per-second": "47.3", "x-llamacpp-draft-n-accepted": "0.82"}
    attrs = await _span_attributes(response)
    assert not any(name.startswith("llamacpp.") for name in attrs)


@pytest.mark.asyncio
async def test_decode_speed_excludes_prefill_and_queueing():
    start = datetime(2026, 9, 29, 12, 0, 0)
    first_token = start + timedelta(seconds=4)
    end = first_token + timedelta(milliseconds=260)
    attrs = await _span_attributes(
        _llamacpp_response(None, completion=14),
        kwargs={"completion_start_time": first_token},
        start_time=start,
        end_time=end,
    )
    assert attrs["llm.ttft_ms"] == pytest.approx(4000.0)
    assert attrs["llm.tpot_ms"] == pytest.approx(20.0)
    assert attrs["llm.tps"] == pytest.approx(50.0)


@pytest.mark.asyncio
async def test_non_streaming_response_has_no_decode_window():
    start = datetime(2026, 9, 29, 12, 0, 0)
    end = start + timedelta(seconds=2)
    attrs = await _span_attributes(
        _llamacpp_response(None), kwargs={"completion_start_time": end}, start_time=start, end_time=end
    )
    assert "llm.ttft_ms" not in attrs, "non-streaming completion_start_time is end_time, so it is not a first token"
    assert "llm.tpot_ms" not in attrs
    assert "llm.tps" not in attrs


# ---------------------------------------------------------------------------
# Failure event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_failure_emits_error_span():
    hook, exporter = _make_hook()
    call_id = "fail-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_failure_event({"litellm_call_id": call_id}, None, None, None)
    spans = exporter.get_finished_spans()
    assert len(spans) == 1
    assert spans[0].attributes["error"] is True
    assert spans[0].status.status_code == StatusCode.ERROR


@pytest.mark.asyncio
async def test_unknown_call_id_is_ignored():
    hook, exporter = _make_hook()
    await hook.async_log_success_event({"litellm_call_id": "ghost"}, _fake_response(), None, None)
    assert exporter.get_finished_spans() == ()


# ---------------------------------------------------------------------------
# Stale span sweep
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_stale_span_is_swept_and_ended():
    hook, exporter = _make_hook()
    call_id = "stale-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    hook._active[call_id]["t0"] -= 400  # make it appear 400s old
    hook._sweep_stale_spans()
    assert call_id not in hook._active
    assert len(exporter.get_finished_spans()) == 1


# ---------------------------------------------------------------------------
# Config loading (#4)
# ---------------------------------------------------------------------------

def test_config_path_resolves_to_a_hook_instance():
    """callbacks: entries are resolved with getattr, never called, so the path must name an instance."""
    from litellm.proxy.types_utils.utils import get_instance_fn

    assert get_instance_fn("litellm.proxy.hooks.otlp_tracer.proxy_handler_instance") is proxy_handler_instance
    assert isinstance(proxy_handler_instance, OTLPTracerHook)


def test_tracer_factory_runs_once_on_first_use():
    calls = []
    hook = OTLPTracerHook(tracer_factory=lambda: calls.append(1))
    assert calls == []
    assert hook._tracer is None
    assert hook._tracer is None
    assert calls == [1]
