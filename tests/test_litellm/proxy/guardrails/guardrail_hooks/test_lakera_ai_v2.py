"""
Tests for Lakera AI v2 guardrail hook (post-call and shared behavior).

PR checklist requires at least one test in tests/test_litellm/.
Additional tests live in tests/guardrails_tests/test_lakera_v2.py.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from litellm.proxy._types import UserAPIKeyAuth
from litellm.proxy.guardrails.guardrail_hooks.lakera_ai_v2 import LakeraAIGuardrail
from litellm.types.utils import ModelResponse


@pytest.mark.asyncio
async def test_lakera_post_call_success_hook_returns_model_response_when_pii_masked():
    """
    Post-call hook must return a ModelResponse (not a dict) when PII is masked,
    so the parent async_post_call_success_deployment_hook accepts it via _is_valid_response_type.
    """
    lakera_guardrail = LakeraAIGuardrail(api_key="test_key")
    mock_response = {
        "payload": [
            {"detector_type": "pii/email", "start": 11, "end": 26, "message_id": 1}
        ],
        "flagged": True,
        "breakdown": [
            {"detector_type": "pii/email", "detected": True, "message_id": 1},
        ],
    }
    llm_response = MagicMock()
    llm_response.model_dump.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Your email is test@example.com",
                }
            },
        ]
    }

    with patch.object(
        lakera_guardrail, "call_v2_guard", new_callable=AsyncMock
    ) as mock_call:
        mock_call.return_value = (mock_response, {})
        data = {
            "messages": [{"role": "user", "content": "Hello"}],
            "model": "gpt-3.5-turbo",
            "metadata": {},
        }
        user_api_key_dict = UserAPIKeyAuth(api_key="test_key")

        result = await lakera_guardrail.async_post_call_success_hook(
            data=data,
            user_api_key_dict=user_api_key_dict,
            response=llm_response,
        )

    assert isinstance(
        result, ModelResponse
    ), "Must return ModelResponse so deployment hook does not discard masked response"
    result_dict = result.model_dump()
    assert "[MASKED" in result_dict["choices"][0]["message"]["content"]
    assert "test@example.com" not in result_dict["choices"][0]["message"]["content"]


@pytest.mark.asyncio
class TestLakeraInstructionsPiiMasking:
    """Regression tests: PII in Responses-API ``instructions`` must be masked."""

    async def test_monitor_mode_masks_pii_in_instructions(self):
        """Regression: monitor mode must mask PII found in `instructions`, not forward it."""
        guardrail = LakeraAIGuardrail(api_key="test_key", on_flagged="monitor")
        data = {
            "instructions": "a@b.com is the contact",
            "input": "hi",
            "model": "gpt-3.5-turbo",
            "metadata": {},
        }
        lakera_response = {
            "flagged": True,
            "breakdown": [{"detector_type": "pii/email", "detected": True, "message_id": 0}],
            "payload": [{"detector_type": "pii/email", "start": 0, "end": 7, "message_id": 0}],
        }
        with patch.object(guardrail, "call_v2_guard", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = (lakera_response, {})
            result = await guardrail.async_pre_call_hook(
                user_api_key_dict=UserAPIKeyAuth(api_key="test_key"),
                cache=MagicMock(),
                data=data,
                call_type="responses",
            )
        assert "a@b.com" not in result["instructions"]
        assert "[MASKED" in result["instructions"]
        assert result["input"] == "hi"

    async def test_monitor_mode_masks_pii_in_input_when_instructions_present(self):
        """Regression: PII in `input` must still be masked when `instructions` is also present."""
        guardrail = LakeraAIGuardrail(api_key="test_key", on_flagged="monitor")
        data = {
            "instructions": "be nice",
            "input": "a@b.com",
            "model": "gpt-3.5-turbo",
            "metadata": {},
        }
        lakera_response = {
            "flagged": True,
            "breakdown": [{"detector_type": "pii/email", "detected": True, "message_id": 1}],
            "payload": [{"detector_type": "pii/email", "start": 0, "end": 7, "message_id": 1}],
        }
        with patch.object(guardrail, "call_v2_guard", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = (lakera_response, {})
            result = await guardrail.async_pre_call_hook(
                user_api_key_dict=UserAPIKeyAuth(api_key="test_key"),
                cache=MagicMock(),
                data=data,
                call_type="responses",
            )
        assert result["instructions"] == "be nice"
        assert "[MASKED" in result["input"]
        assert "a@b.com" not in result["input"]

    async def test_monitor_mode_does_not_block(self):
        """Monitor mode must allow the request through even when PII is detected."""
        guardrail = LakeraAIGuardrail(api_key="test_key", on_flagged="monitor")
        data = {
            "instructions": "tell me about a@b.com",
            "input": "sensitive data: ssn 123-45-6789",
            "model": "gpt-3.5-turbo",
            "metadata": {},
        }
        lakera_response = {
            "flagged": True,
            "breakdown": [{"detector_type": "pii/email", "detected": True, "message_id": 0}],
            "payload": [{"detector_type": "pii/email", "start": 17, "end": 24, "message_id": 0}],
        }
        with patch.object(guardrail, "call_v2_guard", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = (lakera_response, {})
            result = await guardrail.async_pre_call_hook(
                user_api_key_dict=UserAPIKeyAuth(api_key="test_key"),
                cache=MagicMock(),
                data=data,
                call_type="responses",
            )
        assert result is not None
        assert not isinstance(result, Exception)

    async def test_build_lakera_inspection_messages_includes_instructions(self):
        """_build_lakera_inspection_messages must include instructions as the first message."""
        guardrail = LakeraAIGuardrail(api_key="test_key")
        data = {
            "instructions": "be helpful",
            "messages": [{"role": "user", "content": "hello"}],
        }
        messages = guardrail._build_lakera_inspection_messages(data)
        assert len(messages) >= 2
        assert messages[0]["content"] == "be helpful"
        assert messages[0]["role"] == "system"

    async def test_build_lakera_inspection_messages_without_instructions(self):
        """Without instructions, must behave like build_inspection_messages."""
        guardrail = LakeraAIGuardrail(api_key="test_key")
        data = {"messages": [{"role": "user", "content": "hello"}]}
        messages = guardrail._build_lakera_inspection_messages(data)
        assert len(messages) == 1
        assert messages[0]["content"] == "hello"

    async def test_mask_unwritable_instructions_pii_returns_false_without_instructions(self):
        """_mask_unwritable_instructions_pii_in_place returns False when no instructions field."""
        guardrail = LakeraAIGuardrail(api_key="test_key")
        data = {"messages": [{"role": "user", "content": "hello"}]}
        result = guardrail._mask_unwritable_instructions_pii_in_place(
            data=data,
            inspected_messages=[{"role": "user", "content": "hello"}],  # type: ignore[list-item]
            lakera_response=None,
            masked_entity_count={},
        )
        assert result is False
