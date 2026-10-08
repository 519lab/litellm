import pytest

from litellm.responses.litellm_completion_transformation.conversation_store import (
    CONVERSATION_KEY_PREFIX,
    RedisConversationStore,
    StoredConversation,
    build_stored_conversation,
)
from litellm.responses.utils import ResponsesAPIRequestUtils
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

    conversation = build_stored_conversation([{"role": "user", "content": "look it up"}], model_response, None)

    assistant = conversation.messages[-1]
    assert assistant["role"] == "assistant"
    assert assistant["tool_calls"] == [tool_call]
