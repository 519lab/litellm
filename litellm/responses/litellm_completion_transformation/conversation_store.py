from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol

from pydantic import BaseModel, ConfigDict, JsonValue, TypeAdapter, ValidationError
from pydantic_core import to_jsonable_python

from litellm._logging import verbose_proxy_logger
from litellm.caching.redis_cache import RedisCache
from litellm.constants import LITELLM_RESPONSES_CONVERSATION_TTL_SECONDS
from litellm.responses.utils import ResponsesAPIRequestUtils
from litellm.types.utils import Choices, ModelResponse

CONVERSATION_KEY_PREFIX = "litellm:responses:conversation:"

_JSON_MESSAGE = TypeAdapter(dict[str, JsonValue])


class StoredConversation(BaseModel):
    model_config = ConfigDict(frozen=True)

    messages: tuple[dict[str, JsonValue], ...]
    litellm_session_id: str | None


class ConversationStore(Protocol):
    async def get(self, response_id: str) -> StoredConversation | None: ...

    async def put(self, response_id: str, conversation: StoredConversation) -> None: ...


def build_stored_conversation(
    sent_messages: Iterable[object],
    model_response: ModelResponse,
    litellm_session_id: str | None,
) -> StoredConversation:
    assistant_messages = tuple(
        choice.message.model_dump(mode="json", exclude_none=True)
        for choice in model_response.choices
        if isinstance(choice, Choices)
    )
    return StoredConversation(
        messages=tuple(
            _JSON_MESSAGE.validate_python(to_jsonable_python(message, exclude_none=True)) for message in sent_messages
        )
        + assistant_messages,
        litellm_session_id=litellm_session_id,
    )


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


def get_default_conversation_store() -> ConversationStore | None:
    try:
        from litellm.proxy.proxy_server import redis_usage_cache
    except ImportError:
        return None
    if redis_usage_cache is None:
        return None
    return RedisConversationStore(redis=redis_usage_cache)
