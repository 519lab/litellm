"""
Render a backend context-window overflow in the shape each client surface
compacts on.

Agentic clients only compact-and-retry when the overflow arrives in their
provider's native shape: Claude Code needs Anthropic's 400
``invalid_request_error`` "prompt is too long: N tokens > M maximum", and
Codex needs a streamed ``response.failed`` whose ``error.code`` is
``context_length_exceeded`` (an HTTP 400 makes it resend the same request).
"""

import json
import re
import time
from dataclasses import dataclass

from fastapi.responses import StreamingResponse

from litellm._uuid import uuid
from litellm.exceptions import ContextWindowExceededError
from litellm.litellm_core_utils.exception_mapping_utils import ExceptionCheckers

_TOKEN_PAIR_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"request \((\d+) tokens\) exceeds the available context size \((\d+) tokens\)"), "prompt_first"),
    (re.compile(r"prompt is too long: (\d+) tokens > (\d+) maximum"), "prompt_first"),
    (
        re.compile(r"maximum context length is (\d+) tokens\. However, your messages resulted in (\d+) tokens"),
        "window_first",
    ),
)


@dataclass(frozen=True, slots=True)
class ContextOverflow:
    prompt_tokens: int | None
    context_window: int | None

    @property
    def message(self) -> str:
        if self.prompt_tokens is None or self.context_window is None:
            return "prompt is too long"
        return f"prompt is too long: {self.prompt_tokens} tokens > {self.context_window} maximum"


def _token_counts(error_text: str) -> tuple[int | None, int | None]:
    for pattern, order in _TOKEN_PAIR_PATTERNS:
        match = pattern.search(error_text)
        if match is None:
            continue
        first, second = int(match.group(1)), int(match.group(2))
        return (first, second) if order == "prompt_first" else (second, first)
    return None, None


def detect_context_overflow(exc: BaseException) -> ContextOverflow | None:
    error_text = str(getattr(exc, "message", "") or exc)
    if not isinstance(exc, ContextWindowExceededError) and not ExceptionCheckers.is_error_str_context_window_exceeded(
        error_text
    ):
        return None
    prompt_tokens, context_window = _token_counts(error_text)
    return ContextOverflow(prompt_tokens=prompt_tokens, context_window=context_window)


def anthropic_prompt_too_long_body(overflow: ContextOverflow, request_id: str | None) -> dict[str, object]:
    request_id_field = {"request_id": request_id} if request_id else {}
    return {
        "type": "error",
        "error": {"type": "invalid_request_error", "message": overflow.message},
        **request_id_field,
    }


def _sse(event: dict[str, object]) -> str:
    return f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"


def responses_context_length_exceeded_stream(
    overflow: ContextOverflow, model: str | None, headers: dict[str, str]
) -> StreamingResponse:
    response = {
        "id": f"resp_{uuid.uuid4().hex}",
        "object": "response",
        "created_at": int(time.time()),
        "model": model,
        "output": [],
    }
    events = (
        {"type": "response.created", "sequence_number": 0, "response": {**response, "status": "in_progress"}},
        {
            "type": "response.failed",
            "sequence_number": 1,
            "response": {
                **response,
                "status": "failed",
                "error": {"code": "context_length_exceeded", "message": overflow.message},
            },
        },
    )
    return StreamingResponse(
        iter(tuple(_sse(event) for event in events)), media_type="text/event-stream", headers=headers
    )
