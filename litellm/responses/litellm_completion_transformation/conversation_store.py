from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, JsonValue, TypeAdapter, ValidationError
from pydantic_core import to_jsonable_python

from litellm._logging import verbose_proxy_logger
from litellm.caching.redis_cache import RedisCache
from litellm.constants import LITELLM_RESPONSES_CONVERSATION_TTL_SECONDS
from litellm.responses.utils import ResponsesAPIRequestUtils
from litellm.types.llms.openai import ResponsesAPIResponse
from litellm.types.utils import Choices, ModelResponse

CONVERSATION_KEY_PREFIX = "litellm:responses:conversation:"

_JSON_OBJECT = TypeAdapter(dict[str, JsonValue])


class StoredConversation(BaseModel):
    model_config = ConfigDict(frozen=True)

    messages: tuple[dict[str, JsonValue], ...]
    litellm_session_id: str | None
    input_message_count: int | None = None
    response: dict[str, JsonValue] | None = None


class ConversationStore(Protocol):
    async def get(self, response_id: str) -> StoredConversation | None: ...

    async def put(self, response_id: str, conversation: StoredConversation) -> None: ...

    async def delete(self, response_id: str) -> bool: ...


def build_stored_conversation(
    sent_messages: Iterable[object],
    model_response: ModelResponse,
    litellm_session_id: str | None,
    responses_api_response: ResponsesAPIResponse,
) -> StoredConversation:
    input_messages = tuple(
        _JSON_OBJECT.validate_python(to_jsonable_python(message, exclude_none=True)) for message in sent_messages
    )
    assistant_messages = tuple(
        choice.message.model_dump(mode="json", exclude_none=True)
        for choice in model_response.choices
        if isinstance(choice, Choices)
    )
    return StoredConversation(
        messages=input_messages + assistant_messages,
        litellm_session_id=litellm_session_id,
        input_message_count=len(input_messages),
        response=_JSON_OBJECT.validate_python(responses_api_response.model_dump(mode="json")),
    )


def _content_parts(content: JsonValue, text_type: str) -> JsonValue:
    if isinstance(content, str):
        return [{"type": text_type, "text": content}]
    return content


def _message_to_input_items(index: int, message: dict[str, JsonValue]) -> tuple[dict[str, JsonValue], ...]:
    item_id = f"msg_{index}"
    match message.get("role"):
        case "tool":
            return (
                {
                    "id": item_id,
                    "type": "function_call_output",
                    "call_id": message.get("tool_call_id"),
                    "output": message.get("content"),
                },
            )
        case "assistant":
            text_items: tuple[dict[str, JsonValue], ...] = (
                (
                    {
                        "id": item_id,
                        "type": "message",
                        "role": "assistant",
                        "content": _content_parts(message["content"], "output_text"),
                    },
                )
                if message.get("content")
                else ()
            )
            tool_calls = message.get("tool_calls")
            return text_items + tuple(
                {
                    "id": f"{item_id}_{call_index}",
                    "type": "function_call",
                    "call_id": call.get("id"),
                    "name": function.get("name"),
                    "arguments": function.get("arguments"),
                }
                for call_index, call in enumerate(tool_calls if isinstance(tool_calls, list) else [])
                if isinstance(call, dict)
                for function in (call.get("function"),)
                if isinstance(function, dict)
            )
        case role:
            return (
                {
                    "id": item_id,
                    "type": "message",
                    "role": role,
                    "content": _content_parts(message.get("content"), "input_text"),
                },
            )


def stored_input_items(
    conversation: StoredConversation,
    after: str | None,
    before: str | None,
    limit: int,
    order: Literal["asc", "desc"],
) -> dict[str, JsonValue]:
    input_messages = conversation.messages[: conversation.input_message_count]
    ascending = tuple(
        item for index, message in enumerate(input_messages) for item in _message_to_input_items(index, message)
    )
    ordered = ascending if order == "asc" else tuple(reversed(ascending))
    ids = tuple(item["id"] for item in ordered)
    start = ids.index(after) + 1 if after in ids else 0
    end = ids.index(before) if before in ids else len(ordered)
    window = ordered[start:end]
    page = window[:limit]
    return {
        "object": "list",
        "data": list(page),
        "first_id": page[0]["id"] if page else None,
        "last_id": page[-1]["id"] if page else None,
        "has_more": len(window) > limit,
    }


def conversation_key(response_id: str) -> str:
    decoded = ResponsesAPIRequestUtils._decode_responses_api_response_id(response_id)
    return CONVERSATION_KEY_PREFIX + (decoded.get("response_id") or response_id)


@dataclass(frozen=True, slots=True)
class RedisConversationStore:
    redis: RedisCache
    ttl_seconds: int = LITELLM_RESPONSES_CONVERSATION_TTL_SECONDS

    async def get(self, response_id: str) -> StoredConversation | None:
        raw: object = await self.redis.async_get_cache(key=conversation_key(response_id))
        if raw is None:
            return None
        try:
            return StoredConversation.model_validate(raw)
        except ValidationError as e:
            verbose_proxy_logger.warning("Ignoring malformed stored conversation for %s: %s", response_id, e)
            return None

    async def put(self, response_id: str, conversation: StoredConversation) -> None:
        await self.redis.async_set_cache(
            key=conversation_key(response_id),
            value=conversation.model_dump(mode="json"),
            ttl=self.ttl_seconds,
        )

    async def delete(self, response_id: str) -> bool:
        deleted: object = await self.redis.async_delete_cache(key=conversation_key(response_id))
        return deleted == 1


def get_default_conversation_store() -> ConversationStore | None:
    try:
        from litellm.proxy.proxy_server import redis_usage_cache
    except ImportError:
        return None
    if redis_usage_cache is None:
        return None
    return RedisConversationStore(redis=redis_usage_cache)
