"""Predicates for classifying calls that should not be billed as LLM inference."""

from __future__ import annotations

from typing import Any

from litellm.constants import NON_INFERENCE_CALL_TYPES


def is_unbilled_non_inference_call(
    call_type: str | None,
    metadata: dict[str, Any] | None,
    response: object | None,
) -> bool:
    """Return True when this call should not produce a cost or spend-log entry.

    Responses API management calls (GET, DELETE, CANCEL, list input items) and
    vector-store operations are read/management actions -- not LLM inference --
    and must not inflate spend tracking.
    """
    return call_type in NON_INFERENCE_CALL_TYPES


def is_unbilled_non_inference_call_from_params(
    call_type: str | None,
    litellm_params: dict[str, Any] | None,
    response: object | None,
) -> bool:
    """Variant that accepts litellm_params instead of metadata."""
    metadata = litellm_params.get("metadata") if litellm_params else None
    return is_unbilled_non_inference_call(call_type, metadata, response)
