"""Regression tests for the responses -> completion fallback bridge guard.

When the Responses API falls back to chat completions (no native responses
config), it must tag the forwarded ``litellm.completion`` / ``litellm.acompletion``
call with ``_skip_responses_api_bridge=True`` so ``completion()`` does not bridge
the request straight back to the Responses API and mutually recurse forever.

Both fallback paths are covered: the sync ``response_api_handler`` (``_is_async``
False) and the async ``async_response_api_handler`` (``_is_async`` True). The
module-level ``litellm.completion`` / ``litellm.acompletion`` are patched to
capture the forwarded kwargs; if the flag-setting line is removed the captured
kwargs lack the flag and these tests fail.
"""

import os
import sys
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.abspath("../../../.."))

from litellm.responses.litellm_completion_transformation.conversation_store import (
    StoredConversation,
    conversation_key,
)
from litellm.responses.litellm_completion_transformation.handler import (
    LiteLLMCompletionTransformationHandler,
)


class _StopForwarding(Exception):
    """Raised by the mocked (a)completion once the forwarded kwargs are captured."""


def test_sync_fallback_tags_skip_responses_api_bridge():
    handler = LiteLLMCompletionTransformationHandler()
    captured: dict = {}

    def fake_completion(**kwargs):
        captured.update(kwargs)
        raise _StopForwarding()

    with patch("litellm.completion", fake_completion):
        with pytest.raises(_StopForwarding):
            handler.response_api_handler(
                model="gpt-4o",
                input="hello",
                responses_api_request={},
                custom_llm_provider="openai",
                _is_async=False,
            )

    assert captured.get("_skip_responses_api_bridge") is True


@pytest.mark.asyncio
async def test_async_fallback_tags_skip_responses_api_bridge():
    handler = LiteLLMCompletionTransformationHandler()
    captured: dict = {}

    async def fake_acompletion(**kwargs):
        captured.update(kwargs)
        raise _StopForwarding()

    with patch("litellm.acompletion", fake_acompletion):
        coro = handler.response_api_handler(
            model="gpt-4o",
            input="hello",
            responses_api_request={},
            custom_llm_provider="openai",
            _is_async=True,
        )
        with pytest.raises(_StopForwarding):
            await coro

    assert captured.get("_skip_responses_api_bridge") is True


class _InMemoryConversationStore:
    def __init__(self) -> None:
        self.conversations: dict[str, StoredConversation] = {}

    async def get(self, response_id: str) -> StoredConversation | None:
        return self.conversations.get(conversation_key(response_id))

    async def put(self, response_id: str, conversation: StoredConversation) -> None:
        self.conversations[conversation_key(response_id)] = conversation


async def _run_turn(handler, text: str, reply: str, stream: bool, **request) -> str:
    response = await handler.response_api_handler(
        model="gpt-4o",
        input=text,
        responses_api_request=request,
        custom_llm_provider="openai",
        _is_async=True,
        stream=stream,
        mock_response=reply,
    )
    if not stream:
        return response.id
    events = [event async for event in response]
    return next(event.response.id for event in events if event.type == "response.completed")


def _transcript(conversation: StoredConversation) -> list[tuple[object, object]]:
    return [(message.get("role"), message.get("content")) for message in conversation.messages]


@pytest.mark.asyncio
@pytest.mark.parametrize("stream", [False, True])
async def test_previous_response_id_rebuilds_history_from_conversation_store(stream: bool):
    store = _InMemoryConversationStore()
    handler = LiteLLMCompletionTransformationHandler(conversation_store_provider=lambda: store)

    first_id = await _run_turn(handler, "My name is Zed", "OK", stream)
    second_id = await _run_turn(handler, "What is my name?", "Zed", stream, previous_response_id=first_id)

    assert _transcript(store.conversations[conversation_key(second_id)]) == [
        ("user", "My name is Zed"),
        ("assistant", "OK"),
        ("user", "What is my name?"),
        ("assistant", "Zed"),
    ]


@pytest.mark.asyncio
async def test_conversation_store_keeps_session_id_across_turns():
    store = _InMemoryConversationStore()
    handler = LiteLLMCompletionTransformationHandler(conversation_store_provider=lambda: store)

    first_id = await _run_turn(handler, "hi", "hello", False)
    second_id = await _run_turn(handler, "again", "hello again", False, previous_response_id=first_id)

    first_session = store.conversations[conversation_key(first_id)].litellm_session_id
    assert first_session is not None
    assert store.conversations[conversation_key(second_id)].litellm_session_id == first_session


@pytest.mark.asyncio
async def test_store_false_skips_conversation_store_write():
    store = _InMemoryConversationStore()
    handler = LiteLLMCompletionTransformationHandler(conversation_store_provider=lambda: store)

    await _run_turn(handler, "secret", "OK", False, store=False)

    assert store.conversations == {}
