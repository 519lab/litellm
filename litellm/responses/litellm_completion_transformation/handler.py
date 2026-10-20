"""
Handler for transforming responses api requests to litellm.completion requests
"""

import uuid
from collections.abc import Callable
from typing import Any, Coroutine, Dict, Literal, Union

from pydantic import JsonValue

import litellm
from litellm.responses.litellm_completion_transformation.conversation_store import (
    CONVERSATION_KEY_PREFIX,
    ConversationStore,
    build_stored_conversation,
    conversation_key,
    get_default_conversation_store,
    stored_input_items,
)
from litellm.responses.litellm_completion_transformation.streaming_iterator import (
    LiteLLMCompletionStreamingIterator,
)
from litellm.responses.litellm_completion_transformation.transformation import (
    LiteLLMCompletionResponsesConfig,
)
from litellm.responses.streaming_iterator import BaseResponsesAPIStreamingIterator
from litellm.types.llms.openai import (
    ResponseInputParam,
    ResponsesAPIOptionalRequestParams,
    ResponsesAPIResponse,
)
from litellm.types.responses.main import DeleteResponseResult
from litellm.types.utils import ModelResponse


class LiteLLMCompletionTransformationHandler:
    def __init__(
        self,
        conversation_store_provider: Callable[[], ConversationStore | None] = get_default_conversation_store,
    ):
        self._conversation_store_provider = conversation_store_provider

    async def aget_stored_response(self, response_id: str) -> ResponsesAPIResponse | None:
        store = self._conversation_store_provider()
        conversation = await store.get(response_id) if store is not None else None
        if conversation is None or conversation.response is None:
            return None
        stored_response = ResponsesAPIResponse.model_validate(conversation.response)
        stored_response.id = conversation_key(response_id).removeprefix(CONVERSATION_KEY_PREFIX)
        return stored_response

    async def alist_stored_input_items(
        self,
        response_id: str,
        after: str | None,
        before: str | None,
        limit: int,
        order: Literal["asc", "desc"],
    ) -> dict[str, JsonValue] | None:
        store = self._conversation_store_provider()
        conversation = await store.get(response_id) if store is not None else None
        if conversation is None or conversation.input_message_count is None:
            return None
        return stored_input_items(conversation, after=after, before=before, limit=limit, order=order)

    async def adelete_stored_response(self, response_id: str) -> DeleteResponseResult | None:
        store = self._conversation_store_provider()
        if store is None or not await store.delete(response_id):
            return None
        return DeleteResponseResult(id=response_id, object="response", deleted=True)

    def response_api_handler(
        self,
        model: str,
        input: Union[str, ResponseInputParam],
        responses_api_request: ResponsesAPIOptionalRequestParams,
        custom_llm_provider: str | None = None,
        _is_async: bool = False,
        stream: bool | None = None,
        extra_headers: Dict[str, Any] | None = None,
        **kwargs,
    ) -> Union[
        ResponsesAPIResponse,
        BaseResponsesAPIStreamingIterator,
        Coroutine[Any, Any, Union[ResponsesAPIResponse, BaseResponsesAPIStreamingIterator]],
    ]:
        litellm_completion_request: dict = (
            LiteLLMCompletionResponsesConfig.transform_responses_api_request_to_chat_completion_request(
                model=model,
                input=input,
                responses_api_request=responses_api_request,
                custom_llm_provider=custom_llm_provider,
                stream=stream,
                extra_headers=extra_headers,
                **kwargs,
            )
        )

        if _is_async:
            return self.async_response_api_handler(
                litellm_completion_request=litellm_completion_request,
                request_input=input,
                responses_api_request=responses_api_request,
                **kwargs,
            )

        completion_args = {}
        completion_args.update(kwargs)
        completion_args.update(litellm_completion_request)
        completion_args["_skip_responses_api_bridge"] = True

        litellm_completion_response: Union[ModelResponse, litellm.CustomStreamWrapper] = litellm.completion(
            **completion_args,
        )

        if isinstance(litellm_completion_response, ModelResponse):
            responses_api_response: ResponsesAPIResponse = (
                LiteLLMCompletionResponsesConfig.transform_chat_completion_response_to_responses_api_response(
                    chat_completion_response=litellm_completion_response,
                    request_input=input,
                    responses_api_request=responses_api_request,
                )
            )

            return responses_api_response

        elif isinstance(litellm_completion_response, litellm.CustomStreamWrapper):
            return LiteLLMCompletionStreamingIterator(
                model=model,
                litellm_custom_stream_wrapper=litellm_completion_response,
                request_input=input,
                responses_api_request=responses_api_request,
                custom_llm_provider=custom_llm_provider,
                litellm_metadata=kwargs.get("litellm_metadata", {}),
            )
        raise ValueError(f"Unexpected response type: {type(litellm_completion_response)}")

    async def async_response_api_handler(
        self,
        litellm_completion_request: dict,
        request_input: Union[str, ResponseInputParam],
        responses_api_request: ResponsesAPIOptionalRequestParams,
        **kwargs,
    ) -> Union[ResponsesAPIResponse, BaseResponsesAPIStreamingIterator]:
        conversation_store = self._conversation_store_provider()
        previous_response_id: str | None = responses_api_request.get("previous_response_id")
        if previous_response_id:
            litellm_completion_request = await LiteLLMCompletionResponsesConfig.async_responses_api_session_handler(
                previous_response_id=previous_response_id,
                litellm_completion_request=litellm_completion_request,
                conversation_store=conversation_store,
            )
        writable_conversation_store = conversation_store if responses_api_request.get("store") is not False else None
        litellm_logging_obj = kwargs.get("litellm_logging_obj")
        litellm_session_id: str = (
            litellm_completion_request.get("litellm_trace_id")
            or getattr(litellm_logging_obj, "litellm_trace_id", None)
            or str(uuid.uuid4())
        )
        sent_messages: list = litellm_completion_request.get("messages") or []

        acompletion_args = {}
        acompletion_args.update(kwargs)
        acompletion_args.update(litellm_completion_request)
        acompletion_args["_skip_responses_api_bridge"] = True
        acompletion_args["litellm_trace_id"] = litellm_session_id

        litellm_completion_response: Union[ModelResponse, litellm.CustomStreamWrapper] = await litellm.acompletion(
            **acompletion_args,
        )

        if isinstance(litellm_completion_response, ModelResponse):
            responses_api_response: ResponsesAPIResponse = (
                LiteLLMCompletionResponsesConfig.transform_chat_completion_response_to_responses_api_response(
                    chat_completion_response=litellm_completion_response,
                    request_input=request_input,
                    responses_api_request=responses_api_request,
                )
            )
            if writable_conversation_store is not None:
                await writable_conversation_store.put(
                    responses_api_response.id,
                    build_stored_conversation(
                        sent_messages, litellm_completion_response, litellm_session_id, responses_api_response
                    ),
                )

            return responses_api_response

        elif isinstance(litellm_completion_response, litellm.CustomStreamWrapper):
            return LiteLLMCompletionStreamingIterator(
                model=litellm_completion_request.get("model") or "",
                litellm_custom_stream_wrapper=litellm_completion_response,
                request_input=request_input,
                responses_api_request=responses_api_request,
                custom_llm_provider=litellm_completion_request.get("custom_llm_provider"),
                litellm_metadata=kwargs.get("litellm_metadata", {}),
                conversation_store=writable_conversation_store,
                sent_messages=sent_messages,
                litellm_session_id=litellm_session_id,
            )
        raise ValueError(f"Unexpected response type: {type(litellm_completion_response)}")
