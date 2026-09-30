import asyncio
import json

import pytest

from litellm.exceptions import BadRequestError, ContextWindowExceededError
from litellm.proxy.common_utils.context_overflow import (
    ContextOverflow,
    anthropic_prompt_too_long_body,
    detect_context_overflow,
    responses_context_length_exceeded_stream,
)

_LLAMACPP_ERROR = (
    '{"error":{"code":400,"message":"request (12510 tokens) exceeds the available context size (8192 tokens), '
    'try increasing it","type":"exceed_context_size_error","n_prompt_tokens":12510,"n_ctx":8192}}'
)


@pytest.mark.parametrize(
    "exc,expected",
    [
        (
            ContextWindowExceededError(message=_LLAMACPP_ERROR, model="qwen", llm_provider="openai"),
            ContextOverflow(prompt_tokens=12510, context_window=8192),
        ),
        (
            BadRequestError(message=_LLAMACPP_ERROR, model="qwen", llm_provider="openai"),
            ContextOverflow(prompt_tokens=12510, context_window=8192),
        ),
        (
            ContextWindowExceededError(
                message="This model's maximum context length is 128000 tokens. However, your messages resulted in "
                "130500 tokens. Please reduce the length of the messages.",
                model="gpt",
                llm_provider="openai",
            ),
            ContextOverflow(prompt_tokens=130500, context_window=128000),
        ),
        (
            ContextWindowExceededError(
                message="prompt is too long: 209375 tokens > 200000 maximum", model="c", llm_provider="anthropic"
            ),
            ContextOverflow(prompt_tokens=209375, context_window=200000),
        ),
        (
            ContextWindowExceededError(message="context window exceeded", model="m", llm_provider="openai"),
            ContextOverflow(prompt_tokens=None, context_window=None),
        ),
    ],
)
def test_detect_context_overflow_extracts_token_counts(exc, expected):
    assert detect_context_overflow(exc) == expected


def test_detect_context_overflow_ignores_other_errors():
    assert (
        detect_context_overflow(BadRequestError(message="invalid tool schema", model="m", llm_provider="openai"))
        is None
    )
    assert detect_context_overflow(RuntimeError("connection reset")) is None


def test_anthropic_body_matches_the_shape_claude_code_compacts_on():
    body = anthropic_prompt_too_long_body(ContextOverflow(12510, 8192), request_id="req_1")

    assert body == {
        "type": "error",
        "error": {"type": "invalid_request_error", "message": "prompt is too long: 12510 tokens > 8192 maximum"},
        "request_id": "req_1",
    }


def test_anthropic_body_without_counts_still_says_prompt_is_too_long():
    body = anthropic_prompt_too_long_body(ContextOverflow(None, None), request_id=None)

    assert body == {"type": "error", "error": {"type": "invalid_request_error", "message": "prompt is too long"}}


def _sse_events(response) -> list[dict]:
    async def _read() -> str:
        return "".join([chunk async for chunk in response.body_iterator])

    raw = asyncio.run(_read())
    return [json.loads(line[len("data: ") :]) for line in raw.splitlines() if line.startswith("data: ")]


def test_responses_stream_ends_in_the_failed_event_codex_compacts_on():
    response = responses_context_length_exceeded_stream(
        ContextOverflow(12510, 8192), model="qwen-local", headers={"x-litellm-call-id": "abc"}
    )

    events = _sse_events(response)
    assert response.status_code == 200
    assert response.media_type == "text/event-stream"
    assert response.headers["x-litellm-call-id"] == "abc"
    assert [event["type"] for event in events] == ["response.created", "response.failed"]
    failed = events[1]["response"]
    assert failed["status"] == "failed"
    assert failed["error"] == {
        "code": "context_length_exceeded",
        "message": "prompt is too long: 12510 tokens > 8192 maximum",
    }
    assert failed["id"] == events[0]["response"]["id"]
