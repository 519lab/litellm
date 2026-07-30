"""
Unit tests for litellm.proxy.hooks.otlp_tracer.

Tests use the in-memory span exporter and inject it via the _tracer parameter
so no real OTLP receiver is required.
"""

import time

import pytest
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import StatusCode

from litellm.proxy.hooks.otlp_tracer import OTLPTracerHook, _parse_float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_hook() -> tuple[OTLPTracerHook, InMemorySpanExporter]:
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    tracer = provider.get_tracer("test")
    hook = OTLPTracerHook(_tracer=tracer)
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
    hook = OTLPTracerHook(_tracer=None)
    hook._tracer = None
    data = {"litellm_call_id": "id-x", "model": "m"}
    result = await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
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
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
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
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    assert "id-1" in hook._active
    assert "span" in hook._active["id-1"]
    assert "t0" in hook._active["id-1"]


@pytest.mark.asyncio
async def test_pre_call_returns_data_unchanged():
    hook, _ = _make_hook()
    data = {"litellm_call_id": "id-2", "model": "m", "extra": "value"}
    result = await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    assert result["extra"] == "value"


# ---------------------------------------------------------------------------
# Success event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_success_emits_span_with_token_attributes():
    hook, exporter = _make_hook()
    call_id = "success-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
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
    assert "llm.tpot_ms" in attrs
    assert "llm.tps" in attrs


@pytest.mark.asyncio
async def test_success_cleans_up_active_state():
    hook, _ = _make_hook()
    call_id = "cleanup-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event({"litellm_call_id": call_id}, _fake_response(), None, None)
    assert call_id not in hook._active


@pytest.mark.asyncio
async def test_success_sets_cache_hit_attribute():
    hook, exporter = _make_hook()
    call_id = "cache-hit-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event(
        {"litellm_call_id": call_id, "cache_hit": True}, _fake_response(), None, None
    )
    assert exporter.get_finished_spans()[0].attributes["cache.hit"] is True


@pytest.mark.asyncio
async def test_success_sets_ok_status():
    hook, exporter = _make_hook()
    call_id = "ok-status-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    await hook.async_log_success_event({"litellm_call_id": call_id}, _fake_response(), None, None)
    assert exporter.get_finished_spans()[0].status.status_code == StatusCode.OK


# ---------------------------------------------------------------------------
# llama.cpp header parsing — reads from response_obj._response_headers
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_llamacpp_headers_parsed_from_response_obj():
    hook, exporter = _make_hook()
    call_id = "llamacpp-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    resp = _fake_response(headers={
        "x-llamacpp-tokens-per-second": "47.3",
        "x-llamacpp-draft-n-accepted": "0.82",
    })
    await hook.async_log_success_event({"litellm_call_id": call_id}, resp, None, None)
    attrs = exporter.get_finished_spans()[0].attributes
    assert attrs["llamacpp.tps"] == pytest.approx(47.3, abs=0.01)
    assert attrs["llamacpp.speculative_acceptance_rate"] == pytest.approx(0.82, abs=0.001)


@pytest.mark.asyncio
async def test_llamacpp_zero_acceptance_rate_is_recorded():
    hook, exporter = _make_hook()
    call_id = "llamacpp-zero"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    resp = _fake_response(headers={"x-llamacpp-draft-n-accepted": "0.0"})
    await hook.async_log_success_event({"litellm_call_id": call_id}, resp, None, None)
    attrs = exporter.get_finished_spans()[0].attributes
    assert "llamacpp.speculative_acceptance_rate" in attrs
    assert attrs["llamacpp.speculative_acceptance_rate"] == pytest.approx(0.0)


@pytest.mark.asyncio
async def test_llamacpp_headers_absent_from_kwargs_not_used():
    hook, exporter = _make_hook()
    call_id = "llamacpp-kwargs"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    # Put headers in kwargs (old location) — must NOT appear in span
    kwargs = {"litellm_call_id": call_id, "_response_headers": {"x-llamacpp-tokens-per-second": "99.9"}}
    await hook.async_log_success_event(kwargs, _fake_response(), None, None)
    attrs = exporter.get_finished_spans()[0].attributes
    assert "llamacpp.tps" not in attrs


# ---------------------------------------------------------------------------
# Failure event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_failure_emits_error_span():
    hook, exporter = _make_hook()
    call_id = "fail-1"
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
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
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None,
                                   data={"litellm_call_id": call_id, "model": "m"}, call_type="completion")
    hook._active[call_id]["t0"] -= 400  # make it appear 400s old
    hook._sweep_stale_spans()
    assert call_id not in hook._active
    assert len(exporter.get_finished_spans()) == 1
