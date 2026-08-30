"""Regression tests: non-inference calls must not produce cost or spend."""

import os
import sys

sys.path.insert(0, os.path.abspath("../../../.."))

import pytest

from litellm.constants import NON_INFERENCE_CALL_TYPES
from litellm.litellm_core_utils.internal_call_metadata import (
    is_unbilled_non_inference_call,
    is_unbilled_non_inference_call_from_params,
)
from litellm.litellm_core_utils.litellm_logging import Logging


@pytest.mark.parametrize("call_type", list(NON_INFERENCE_CALL_TYPES))
def test_non_inference_call_types_are_detected(call_type):
    assert is_unbilled_non_inference_call(call_type, None, None) is True


@pytest.mark.parametrize(
    "call_type",
    ["completion", "acompletion", "responses", "aresponses", "embedding", "aembedding"],
)
def test_inference_call_types_are_not_detected(call_type):
    assert is_unbilled_non_inference_call(call_type, None, None) is False


def test_none_call_type_is_not_non_inference():
    assert is_unbilled_non_inference_call(None, None, None) is False


def test_from_params_variant_matches_base():
    for call_type in NON_INFERENCE_CALL_TYPES:
        assert is_unbilled_non_inference_call_from_params(call_type, None, None) is True
    assert is_unbilled_non_inference_call_from_params("acompletion", None, None) is False


def test_response_cost_calculator_returns_zero_for_non_inference():
    """LiteLLMLoggingObj._response_cost_calculator must return 0.0 for non-inference calls."""
    logging_obj = Logging(
        model="gpt-4o",
        messages=[],
        stream=False,
        call_type="get_responses",
        start_time=None,
        litellm_call_id="test",
        function_id="test",
    )
    cost = logging_obj._response_cost_calculator(result={})
    assert cost == 0.0, f"Expected 0.0, got {cost}"


def test_response_cost_calculator_does_not_force_zero_for_inference_calls():
    """Inference calls must not be forcibly zeroed by the non-inference gate."""
    logging_obj = Logging(
        model="gpt-4o",
        messages=[],
        stream=False,
        call_type="acompletion",
        start_time=None,
        litellm_call_id="test",
        function_id="test",
    )
    cost = logging_obj._response_cost_calculator(result={})
    assert cost != 0.0 or cost is None, "Inference calls should not be forcibly zeroed"
