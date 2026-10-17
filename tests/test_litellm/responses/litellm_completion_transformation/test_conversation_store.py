import pytest

from litellm.responses.litellm_completion_transformation.conversation_store import (
    CONVERSATION_KEY_PREFIX,
    RedisConversationStore,
    StoredConversation,
    build_stored_conversation,
    stored_input_items,
)
from litellm.responses.utils import ResponsesAPIRequestUtils
from litellm.types.llms.openai import ResponsesAPIResponse
from litellm.types.utils import ModelResponse


class _FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, object] = {}
        self.ttls: dict[str, object] = {}

    async def async_get_cache(self, key: str) -> object:
        return self.values.get(key)

    async def async_set_cache(self, key: str, value: object, ttl: object = None) -> None:
        self.values[key] = value
        self.ttls[key] = ttl

    async def async_delete_cache(self, key: str) -> int:
        return 1 if self.values.pop(key, None) is not None else 0


def _conversation() -> StoredConversation:
    return StoredConversation(messages=({"role": "user", "content": "hi"},), litellm_session_id="session-1")


@pytest.mark.asyncio
async def test_encoded_and_raw_response_ids_share_one_key_with_ttl():
    redis = _FakeRedis()
    store = RedisConversationStore(redis=redis, ttl_seconds=60)
    encoded_id = ResponsesAPIRequestUtils._build_responses_api_response_id(
        custom_llm_provider="openai", model_id="model-1", response_id="chatcmpl-abc"
    )

    await store.put("chatcmpl-abc", _conversation())

    assert await store.get(encoded_id) == _conversation()
    assert redis.ttls == {CONVERSATION_KEY_PREFIX + "chatcmpl-abc": 60}


@pytest.mark.asyncio
async def test_malformed_stored_value_is_a_miss():
    redis = _FakeRedis()
    redis.values[CONVERSATION_KEY_PREFIX + "chatcmpl-abc"] = {"messages": "not a list"}

    assert await RedisConversationStore(redis=redis).get("chatcmpl-abc") is None


def test_build_stored_conversation_keeps_assistant_tool_calls():
    tool_call = {"id": "call_1", "type": "function", "function": {"name": "lookup", "arguments": "{}"}}
    model_response = ModelResponse(
        choices=[{"index": 0, "message": {"role": "assistant", "content": None, "tool_calls": [tool_call]}}]
    )

    conversation = build_stored_conversation(
        [{"role": "user", "content": "look it up"}], model_response, None, _responses_api_response()
    )

    assistant = conversation.messages[-1]
    assert assistant["role"] == "assistant"
    assert assistant["tool_calls"] == [tool_call]


def _responses_api_response() -> ResponsesAPIResponse:
    return ResponsesAPIResponse(id="chatcmpl-abc", created_at=0, output=[], status="completed")


@pytest.mark.asyncio
async def test_delete_reports_whether_a_conversation_existed():
    store = RedisConversationStore(redis=_FakeRedis())
    await store.put("chatcmpl-abc", _conversation())

    assert await store.delete("chatcmpl-abc") is True
    assert await store.delete("chatcmpl-abc") is False
    assert await store.get("chatcmpl-abc") is None


def _tool_conversation() -> StoredConversation:
    return StoredConversation(
        messages=(
            {"role": "user", "content": "weather?"},
            {
                "role": "assistant",
                "tool_calls": [
                    {"id": "call_1", "type": "function", "function": {"name": "weather", "arguments": "{}"}}
                ],
            },
            {"role": "tool", "tool_call_id": "call_1", "content": "sunny"},
            {"role": "assistant", "content": "It is sunny"},
        ),
        litellm_session_id=None,
        input_message_count=3,
    )


def test_input_items_map_tool_calls_and_exclude_the_reply():
    items = stored_input_items(_tool_conversation(), after=None, before=None, limit=20, order="asc")

    assert [item["type"] for item in items["data"]] == ["message", "function_call", "function_call_output"]
    assert items["data"][1] == {
        "id": "msg_1_0",
        "type": "function_call",
        "call_id": "call_1",
        "name": "weather",
        "arguments": "{}",
    }
    assert items["data"][2]["output"] == "sunny"


def test_input_items_paginate_in_requested_order():
    first_page = stored_input_items(_tool_conversation(), after=None, before=None, limit=2, order="desc")
    second_page = stored_input_items(
        _tool_conversation(), after=first_page["last_id"], before=None, limit=2, order="desc"
    )

    assert [item["id"] for item in first_page["data"]] == ["msg_2", "msg_1_0"]
    assert first_page["has_more"] is True
    assert [item["id"] for item in second_page["data"]] == ["msg_0"]
    assert second_page["has_more"] is False
