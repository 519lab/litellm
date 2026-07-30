"""
Regression tests for litellm.proxy.hooks.llamacpp.

Each test covers one of the five known llama.cpp grammar-builder failure modes:
  1. 'pattern' keyword causes Python-side conversion error.
  2. Numeric range keywords (minimum/maximum/exclusiveMinimum/exclusiveMaximum/multipleOf)
     cause the grammar builder to emit {n,m} GBNF quantifiers the sampler rejects.
  3. Large minLength/maxLength in nested sub-schemas overflow the grammar expander.
  4. Non-llamacpp backends are not modified.
  5. response_format.json_schema schemas are sanitized in addition to tool parameters.
"""

import pytest

from litellm.proxy.hooks.llamacpp.main import (
    LLAMACPP_API_BASE,
    _LEN_CAP,
    _sanitize_schema,
    LlamaCppPatternStripper,
)


@pytest.fixture()
def hook() -> LlamaCppPatternStripper:
    return LlamaCppPatternStripper()


def _llamacpp_kwargs(**extra) -> dict:
    return {"api_base": LLAMACPP_API_BASE, **extra}


# --- _sanitize_schema unit tests ---

def test_pattern_keyword_stripped():
    schema = {"type": "string", "pattern": "^[a-z]+$"}
    _sanitize_schema(schema)
    assert "pattern" not in schema


def test_numeric_range_keywords_stripped():
    schema = {
        "type": "integer",
        "minimum": 0,
        "maximum": 100,
        "exclusiveMinimum": -1,
        "exclusiveMaximum": 101,
        "multipleOf": 5,
    }
    _sanitize_schema(schema)
    for key in ("minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"):
        assert key not in schema, f"expected {key!r} to be stripped"


def test_large_minlength_maxlength_clamped_in_nested():
    schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "minLength": 0, "maxLength": 999},
        },
    }
    _sanitize_schema(schema)
    prop = schema["properties"]["name"]
    assert prop["maxLength"] == _LEN_CAP
    assert prop["minLength"] == 0  # under cap, unchanged


def test_top_level_minlength_maxlength_not_clamped():
    """Top-level length constraints on the parameters object itself are safe."""
    schema = {"type": "string", "minLength": 1, "maxLength": 999}
    _sanitize_schema(schema, depth=0)
    assert schema["maxLength"] == 999  # not clamped at depth 0


def test_nested_schemas_sanitized_recursively():
    schema = {
        "type": "object",
        "properties": {
            "tags": {
                "type": "array",
                "items": {"type": "string", "pattern": r"\w+"},
            }
        },
    }
    _sanitize_schema(schema)
    assert "pattern" not in schema["properties"]["tags"]["items"]


def test_anyof_oneof_allof_sanitized():
    schema = {
        "anyOf": [
            {"type": "string", "pattern": ".*"},
            {"type": "integer", "minimum": 0},
        ]
    }
    _sanitize_schema(schema)
    for sub in schema["anyOf"]:
        assert "pattern" not in sub
        assert "minimum" not in sub


# --- LlamaCppPatternStripper hook tests ---

@pytest.mark.asyncio
async def test_hook_sanitizes_tool_parameters(hook):
    kwargs = _llamacpp_kwargs(
        tools=[{
            "type": "function",
            "function": {
                "name": "search",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "pattern": "^.+$"},
                    },
                },
            },
        }]
    )
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is not None
    assert "pattern" not in result["tools"][0]["function"]["parameters"]["properties"]["query"]


@pytest.mark.asyncio
async def test_hook_sanitizes_response_format(hook):
    kwargs = _llamacpp_kwargs(
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "output",
                "schema": {
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer", "minimum": 0, "maximum": 99},
                    },
                },
            },
        }
    )
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    schema = result["response_format"]["json_schema"]["schema"]
    assert "minimum" not in schema["properties"]["count"]
    assert "maximum" not in schema["properties"]["count"]


@pytest.mark.asyncio
async def test_hook_skips_non_llamacpp_backend(hook):
    kwargs = {
        "api_base": "https://api.openai.com/v1",
        "tools": [{
            "type": "function",
            "function": {
                "name": "fn",
                "parameters": {"type": "object", "properties": {"x": {"pattern": ".*"}}},
            },
        }],
    }
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is None
    # original untouched
    assert "pattern" in kwargs["tools"][0]["function"]["parameters"]["properties"]["x"]


@pytest.mark.asyncio
async def test_hook_returns_none_when_no_modification_needed(hook):
    kwargs = _llamacpp_kwargs(messages=[{"role": "user", "content": "hello"}])
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is None
