"""
Tests for reasoning effort capability fields and normalize_reasoning_effort_value.

Covers:
- Commit 1: get_model_info returns supports_minimal/supports_max fields
- Commit 2: Model registry entries have correct reasoning effort fields
- Commit 3: normalize_reasoning_effort_value degradation chains + adapter translation
"""

import json
import os
from typing import Any, Dict, Final, Optional
from unittest.mock import patch

import pytest

import litellm
from litellm.llms.anthropic.experimental_pass_through.utils import (
    normalize_reasoning_effort_value,
)
from litellm.utils import get_model_info


@pytest.fixture
def local_model_cost_map(monkeypatch):
    original = litellm.model_cost
    monkeypatch.setenv("LITELLM_LOCAL_MODEL_COST_MAP", "True")
    litellm.model_cost = litellm.get_model_cost_map(url="")
    litellm.get_model_info.cache_clear()
    try:
        yield
    finally:
        litellm.model_cost = original
        litellm.get_model_info.cache_clear()


def _load_model_registry() -> Dict[str, Any]:
    """Load the root model_prices_and_context_window.json."""
    json_path = os.path.join(
        os.path.dirname(__file__),
        "../../../../../model_prices_and_context_window.json",
    )
    with open(json_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Commit 1: get_model_info returns supports_minimal and supports_max fields
# ---------------------------------------------------------------------------


class TestGetModelInfoReasoningEffortFields:
    """get_model_info should expose supports_minimal_reasoning_effort and
    supports_max_reasoning_effort from the model registry."""

    def test_opus_4_6_has_supports_minimal(self):
        info = get_model_info("claude-opus-4-6")
        assert "supports_minimal_reasoning_effort" in info

    def test_opus_4_6_has_supports_max(self):
        info = get_model_info("claude-opus-4-6")
        assert "supports_max_reasoning_effort" in info

    def test_opus_4_7_has_supports_minimal(self):
        info = get_model_info("claude-opus-4-7")
        assert "supports_minimal_reasoning_effort" in info

    def test_opus_4_7_has_supports_max(self):
        info = get_model_info("claude-opus-4-7")
        assert "supports_max_reasoning_effort" in info


# ---------------------------------------------------------------------------
# Commit 2: JSON registry has correct reasoning effort fields
# ---------------------------------------------------------------------------


class TestModelRegistryReasoningEffortFields:
    """Verify specific models have the expected reasoning effort capability
    values in the JSON registry file.

    Claude models intentionally OMIT ``supports_minimal_reasoning_effort``:
    ``minimal`` is not a real Anthropic effort level (the API accepts only
    low/medium/high/xhigh/max), so LiteLLM degrades ``minimal`` to ``low``
    regardless of the flag. These tests guard against the flag being
    re-added to the Claude fleet."""

    @pytest.fixture(autouse=True)
    def _load_registry(self):
        self.registry = _load_model_registry()

    def test_opus_4_7_supports_max(self):
        entry = self.registry["claude-opus-4-7"]
        assert entry.get("supports_max_reasoning_effort") is True

    def test_opus_4_6_supports_max(self):
        entry = self.registry["claude-opus-4-6"]
        assert entry.get("supports_max_reasoning_effort") is True

    def test_opus_4_7_omits_minimal(self):
        entry = self.registry["claude-opus-4-7"]
        assert "supports_minimal_reasoning_effort" not in entry

    def test_opus_4_6_omits_minimal(self):
        entry = self.registry["claude-opus-4-6"]
        assert "supports_minimal_reasoning_effort" not in entry

    def test_sonnet_4_6_omits_minimal(self):
        entry = self.registry["anthropic.claude-sonnet-4-6"]
        assert "supports_minimal_reasoning_effort" not in entry

    def test_bedrock_opus_4_7_supports_max(self):
        entry = self.registry["anthropic.claude-opus-4-7"]
        assert entry.get("supports_max_reasoning_effort") is True
        assert "supports_minimal_reasoning_effort" not in entry

    def test_vertex_opus_4_7_supports_max(self):
        entry = self.registry["vertex_ai/claude-opus-4-7"]
        assert entry.get("supports_max_reasoning_effort") is True
        assert "supports_minimal_reasoning_effort" not in entry

    def test_vertex_opus_4_6_supports_max(self):
        entry = self.registry["vertex_ai/claude-opus-4-6"]
        assert entry.get("supports_max_reasoning_effort") is True
        assert "supports_minimal_reasoning_effort" not in entry

    def test_azure_ai_opus_4_6_omits_minimal(self):
        entry = self.registry["azure_ai/claude-opus-4-6"]
        assert "supports_minimal_reasoning_effort" not in entry

    def test_azure_ai_opus_4_7_supports_max(self):
        entry = self.registry["azure_ai/claude-opus-4-7"]
        assert entry.get("supports_max_reasoning_effort") is True
        assert "supports_minimal_reasoning_effort" not in entry


# ---------------------------------------------------------------------------
# Commit 3: normalize_reasoning_effort_value
# ---------------------------------------------------------------------------


class TestNormalizeReasoningEffortValue:
    """Degradation chains driven against the bundled map rather than hand-built flag dicts.

    The new implementation resolves supported levels through the same owner that answers
    /model_group/info, so tests use real map entries to pin behavior."""

    @pytest.mark.parametrize(
        "model, provider, effort, expected",
        [
            ("claude-opus-4-7", "anthropic", "max", "max"),
            ("gpt-5-mini", "azure", "max", "high"),
            ("gpt-5-mini", "azure", "xhigh", "high"),
            ("gpt-5-mini", "azure", "minimal", "minimal"),
        ],
    )
    def test_a_tier_degrades_to_the_nearest_level_the_entry_accepts(
        self, local_model_cost_map, model, provider, effort, expected
    ):
        assert normalize_reasoning_effort_value(effort, model, provider) == expected

    @pytest.mark.parametrize("effort", ["none", "low", "medium", "high"])
    def test_a_tier_outside_any_chain_passes_through(self, local_model_cost_map, effort):
        assert normalize_reasoning_effort_value(effort, "claude-opus-4-7", "anthropic") == effort

    @pytest.mark.parametrize("effort, expected", [("max", "high"), ("xhigh", "high"), ("minimal", "low")])
    def test_a_model_the_map_does_not_describe_keeps_the_floor(self, local_model_cost_map, effort, expected):
        assert normalize_reasoning_effort_value(effort, "totally-made-up-model-xyz", "openai") == expected

    def test_exception_fallback_keeps_chain_floor(self):
        """When get_model_info raises, fall back to the chain terminal."""
        with patch(
            "litellm.utils.get_model_info",
            side_effect=Exception("model not found"),
        ):
            assert normalize_reasoning_effort_value("max", model="unknown") == "high"
            assert normalize_reasoning_effort_value("minimal", model="unknown") == "low"


# ---------------------------------------------------------------------------
# Commit 3: Adapter translation — adaptive thinking + output_config.effort
# ---------------------------------------------------------------------------


class TestAdapterAdaptiveThinking:
    """Test that adaptive thinking type maps correctly through the adapters."""

    def test_messages_adapter_adaptive_returns_medium_default(self):
        """Adaptive thinking returns 'medium' as default reasoning_effort."""
        from litellm.llms.anthropic.experimental_pass_through.adapters.transformation import (
            LiteLLMAnthropicMessagesAdapter,
        )

        adapter = LiteLLMAnthropicMessagesAdapter()
        result = adapter.translate_anthropic_thinking_to_reasoning_effort(
            {"type": "adaptive"}
        )
        assert result == "medium"

    def test_messages_adapter_adaptive_overridden_by_output_config(self):
        """For adaptive thinking, output_config.effort overrides reasoning_effort."""
        from litellm.llms.anthropic.experimental_pass_through.adapters.transformation import (
            LiteLLMAnthropicMessagesAdapter,
        )
        from litellm.types.llms.anthropic import AnthropicMessagesRequest

        adapter = LiteLLMAnthropicMessagesAdapter()
        request = AnthropicMessagesRequest(
            model="test-model",
            messages=[{"role": "user", "content": "hello"}],
            max_tokens=1024,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
        )
        openai_kwargs, _ = adapter.translate_anthropic_to_openai(request)
        # reasoning_effort should be set (either as string or dict with effort)
        re = openai_kwargs.get("reasoning_effort")
        if isinstance(re, dict):
            assert re["effort"] == "high"
        else:
            assert re == "high"

    def test_responses_adapter_adaptive_with_output_config(self):
        """Responses adapter: adaptive thinking + output_config.effort."""
        from litellm.llms.anthropic.experimental_pass_through.responses_adapters.transformation import (
            LiteLLMAnthropicToResponsesAPIAdapter,
        )

        result = LiteLLMAnthropicToResponsesAPIAdapter.translate_thinking_to_reasoning(
            thinking={"type": "adaptive"},
            output_config={"effort": "xhigh"},
        )
        assert result is not None
        assert result["effort"] == "xhigh"

    def test_responses_adapter_adaptive_default_medium(self):
        """Responses adapter: adaptive thinking without output_config defaults to medium."""
        from litellm.llms.anthropic.experimental_pass_through.responses_adapters.transformation import (
            LiteLLMAnthropicToResponsesAPIAdapter,
        )

        result = LiteLLMAnthropicToResponsesAPIAdapter.translate_thinking_to_reasoning(
            thinking={"type": "adaptive"},
        )
        assert result is not None
        assert result["effort"] == "medium"
