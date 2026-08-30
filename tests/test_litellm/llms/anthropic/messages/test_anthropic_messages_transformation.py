"""Regression tests for litellm/llms/anthropic/experimental_pass_through/messages/transformation.py."""

from __future__ import annotations

import pytest

from litellm.llms.anthropic.experimental_pass_through.messages.transformation import (
    AnthropicMessagesConfig,
)


class TestTranslateReasoningEffortThinkingBudgetCap:
    """Regression for: reasoning_effort thinking budget can exceed max_tokens, causing Anthropic 400.

    A deployment carrying reasoning_effort in its litellm_params forwarded the mapped budget_tokens
    as-is, so any request whose max_tokens was at or below that budget was rejected with a hard 400.
    """

    _MODEL = "claude-3-5-sonnet-20241022"
    _PROVIDER = "anthropic"

    def _call(self, reasoning_effort: str, max_tokens: int) -> dict:
        params: dict = {"reasoning_effort": reasoning_effort}
        AnthropicMessagesConfig._translate_reasoning_effort_to_anthropic(
            model=self._MODEL,
            optional_params=params,
            max_tokens=max_tokens,
            custom_llm_provider=self._PROVIDER,
        )
        return params

    def test_budget_capped_below_max_tokens(self) -> None:
        params = self._call("high", max_tokens=3000)
        thinking = params.get("thinking")
        assert isinstance(thinking, dict), f"thinking should be set; got {params}"
        assert thinking["budget_tokens"] < 3000, f"budget_tokens={thinking['budget_tokens']} not capped below max_tokens=3000"

    def test_thinking_dropped_when_max_tokens_too_small(self) -> None:
        params = self._call("high", max_tokens=100)
        assert "thinking" not in params, f"thinking should be dropped when max_tokens=100 < min budget; got {params}"

    def test_budget_preserved_when_it_already_fits(self) -> None:
        params = self._call("low", max_tokens=10_000)
        thinking = params.get("thinking")
        assert isinstance(thinking, dict), f"thinking should be set; got {params}"
        assert thinking["budget_tokens"] == 1024
