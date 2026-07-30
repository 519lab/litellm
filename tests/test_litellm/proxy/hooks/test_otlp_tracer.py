"""
Unit tests for litellm.proxy.hooks.otlp_tracer.

Tests are structured around the in-memory span exporter so no real OTLP
receiver is required.
"""

import pytest
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry import trace as otel_trace

from litellm.proxy.hooks.otlp_tracer import OTLPTracerHook, _parse_float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_hook_with_in_memory_exporter() -> tuple[OTLPTracerHook, InMemorySpanExporter]:
    """Return a hook wired to an in-memory exporter, bypassing the GRPC exporter."""
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))

    hook = OTLPTracerHook.__new__(OTLPTracerHook)
    hook._tracer = provider.get_tracer("test")
    hook._active = {}
    return hook, exporter


def _fake_usage(prompt=10, completion=20, total=30):
    class Usage:
        prompt_tokens = prompt
        completion_tokens = completion
        total_tokens = total
    return Usage()


def _fake_response(prompt=10, completion=20, total=30):
    class Response:
        usage = _fake_usage(prompt, completion, total)
    return Response()


# ---------------------------------------------------------------------------
# _parse_float
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("val,expected", [
    ("12.5", 12.5),
    (99, 99.0),
    ("bad", None),
    (None, None),
])
def test_parse_float(val, expected):
    assert _parse_float(val) == expected


# ---------------------------------------------------------------------------
# Pre-call hook
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pre_call_registers_span():
    hook, _ = _make_hook_with_in_memory_exporter()
    data = {"litellm_call_id": "id-1", "model": "test-model"}
    await hook.async_pre_call_hook(
        user_api_key_dict=None, cache_obj=None, data=data, call_type="completion"
    )
    assert "id-1" in hook._active
    assert "span" in hook._active["id-1"]
    assert "t0" in hook._active["id-1"]


@pytest.mark.asyncio
async def test_pre_call_returns_data_unchanged():
    hook, _ = _make_hook_with_in_memory_exporter()
    data = {"litellm_call_id": "id-2", "model": "m", "extra": "value"}
    result = await hook.async_pre_call_hook(
        user_api_key_dict=None, cache_obj=None, data=data, call_type="completion"
    )
    assert result["extra"] == "value"


# ---------------------------------------------------------------------------
# Success event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_success_emits_span_with_token_attributes():
    hook, exporter = _make_hook_with_in_memory_exporter()
    call_id = "success-1"
    data = {"litellm_call_id": call_id, "model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")

    kwargs = {"litellm_call_id": call_id, "cache_hit": False}
    await hook.async_log_success_event(kwargs, _fake_response(10, 50, 60), None, None)

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
    hook, _ = _make_hook_with_in_memory_exporter()
    call_id = "cleanup-1"
    data = {"litellm_call_id": call_id, "model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    await hook.async_log_success_event(
        {"litellm_call_id": call_id}, _fake_response(), None, None
    )
    assert call_id not in hook._active


@pytest.mark.asyncio
async def test_success_sets_cache_hit_attribute():
    hook, exporter = _make_hook_with_in_memory_exporter()
    call_id = "cache-hit-1"
    data = {"litellm_call_id": call_id, "model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    kwargs = {"litellm_call_id": call_id, "cache_hit": True}
    await hook.async_log_success_event(kwargs, _fake_response(), None, None)
    attrs = exporter.get_finished_spans()[0].attributes
    assert attrs["cache.hit"] is True


@pytest.mark.asyncio
async def test_llamacpp_headers_parsed():
    hook, exporter = _make_hook_with_in_memory_exporter()
    call_id = "llamacpp-1"
    data = {"litellm_call_id": call_id, "model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    kwargs = {
        "litellm_call_id": call_id,
        "_response_headers": {
            "x-llamacpp-tokens-per-second": "47.3",
            "x-llamacpp-draft-n-accepted": "0.82",
        },
    }
    await hook.async_log_success_event(kwargs, _fake_response(), None, None)
    attrs = exporter.get_finished_spans()[0].attributes
    assert attrs["llamacpp.tps"] == pytest.approx(47.3, abs=0.01)
    assert attrs["llamacpp.speculative_acceptance_rate"] == pytest.approx(0.82, abs=0.001)


# ---------------------------------------------------------------------------
# Failure event
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_failure_emits_error_span():
    hook, exporter = _make_hook_with_in_memory_exporter()
    call_id = "fail-1"
    data = {"litellm_call_id": call_id, "model": "m"}
    await hook.async_pre_call_hook(user_api_key_dict=None, cache_obj=None, data=data, call_type="completion")
    await hook.async_log_failure_event(
        {"litellm_call_id": call_id}, None, None, None
    )
    spans = exporter.get_finished_spans()
    assert len(spans) == 1
    assert spans[0].attributes["error"] is True


@pytest.mark.asyncio
async def test_unknown_call_id_is_ignored():
    """Closing a span for an ID we never opened must not raise."""
    hook, exporter = _make_hook_with_in_memory_exporter()
    await hook.async_log_success_event(
        {"litellm_call_id": "ghost"}, _fake_response(), None, None
    )
    assert exporter.get_finished_spans() == ()
