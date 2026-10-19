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

import functools

import pytest

from litellm.proxy.hooks.llamacpp.main import (
    LLAMACPP_API_BASE,
    _LEN_CAP,
    MAX_SCHEMA_DEPTH,
    _sanitize_schema,
    LlamaCppPatternStripper,
)


@pytest.fixture()
def hook() -> LlamaCppPatternStripper:
    return LlamaCppPatternStripper()


def _llamacpp_kwargs(**extra) -> dict:
    return {"api_base": LLAMACPP_API_BASE, **extra}


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
    assert prop["minLength"] == 0


def test_top_level_minlength_maxlength_not_clamped():
    """Top-level length constraints on the parameters object itself are safe."""
    schema = {"type": "string", "minLength": 1, "maxLength": 999}
    _sanitize_schema(schema, depth=0)
    assert schema["maxLength"] == 999


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
    assert "pattern" in kwargs["tools"][0]["function"]["parameters"]["properties"]["x"]


@pytest.mark.asyncio
async def test_hook_returns_none_when_no_modification_needed(hook):
    kwargs = _llamacpp_kwargs(messages=[{"role": "user", "content": "hello"}])
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is None


@pytest.mark.asyncio
async def test_hook_returns_none_when_schema_has_no_stripped_keys(hook):
    """A schema with no offending keys must not trigger a return (modified=False)."""
    kwargs = _llamacpp_kwargs(
        tools=[{
            "type": "function",
            "function": {
                "name": "fn",
                "parameters": {"type": "object", "properties": {"x": {"type": "string"}}},
            },
        }]
    )
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is None


@pytest.mark.asyncio
async def test_hook_activates_via_litellm_params(hook):
    kwargs = {
        "litellm_params": {"api_base": LLAMACPP_API_BASE},
        "tools": [{
            "type": "function",
            "function": {
                "name": "fn",
                "parameters": {"type": "object", "properties": {"x": {"pattern": ".*"}}},
            },
        }],
    }
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is not None
    assert "pattern" not in result["tools"][0]["function"]["parameters"]["properties"]["x"]


@pytest.mark.asyncio
async def test_hook_survives_litellm_params_none(hook):
    """litellm_params=None must not crash _is_llamacpp."""
    kwargs = {"api_base": "https://api.openai.com", "litellm_params": None}
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is None


def test_items_as_list_traversed():
    schema = {
        "type": "array",
        "items": [
            {"type": "string", "pattern": "^x$"},
            {"type": "integer", "minimum": 0},
        ],
    }
    _sanitize_schema(schema)
    assert "pattern" not in schema["items"][0]
    assert "minimum" not in schema["items"][1]


def test_if_then_else_traversed():
    schema = {
        "if": {"type": "string", "pattern": "^y$"},
        "then": {"type": "integer", "minimum": 1},
        "else": {"type": "number", "maximum": 99},
    }
    _sanitize_schema(schema)
    assert "pattern" not in schema["if"]
    assert "minimum" not in schema["then"]
    assert "maximum" not in schema["else"]


def test_sanitize_schema_returns_true_on_change():
    assert _sanitize_schema({"type": "string", "pattern": ".*"}) is True


def test_sanitize_schema_returns_false_when_clean():
    assert _sanitize_schema({"type": "string"}) is False


def test_maxlength_at_cap_not_clamped():
    schema = {"type": "string", "maxLength": _LEN_CAP}
    _sanitize_schema(schema, depth=1)
    assert schema["maxLength"] == _LEN_CAP


def test_recursion_guard_halts_at_max_depth():
    """Deeply-nested schemas must not cause RecursionError."""
    schema: dict = {"type": "string", "pattern": "x"}
    for _ in range(30):
        schema = {"type": "object", "properties": {"child": schema}}
    _sanitize_schema(schema)


def test_prefix_items_traversed():
    """Regression: pattern inside prefixItems caused a 400 from llama.cpp grammar builder."""
    schema = {
        "type": "array",
        "prefixItems": [
            {"type": "string", "pattern": "[a-z]+"},
            {"type": "number", "minimum": 0},
        ],
    }
    _sanitize_schema(schema)
    assert "pattern" not in schema["prefixItems"][0]
    assert "minimum" not in schema["prefixItems"][1]


@pytest.mark.asyncio
async def test_hook_sanitizes_prefix_items_in_response_format(hook):
    """End-to-end: prefixItems pattern in response_format is stripped before reaching llama.cpp."""
    kwargs = _llamacpp_kwargs(
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "output",
                "schema": {
                    "type": "array",
                    "prefixItems": [
                        {"type": "string", "pattern": "[a-z]+"},
                        {"type": "integer"},
                    ],
                },
            },
        }
    )
    result = await hook.async_pre_call_deployment_hook(kwargs, call_type=None)
    assert result is not None
    items = result["response_format"]["json_schema"]["schema"]["prefixItems"]
    assert "pattern" not in items[0]


def _nested_properties(levels: int) -> dict:
    return functools.reduce(
        lambda inner, _: {"type": "object", "properties": {"child": inner}},
        range(levels),
        {"type": "string", "pattern": "^z$"},
    )


def _leaf(schema: dict) -> dict:
    return schema if "properties" not in schema else _leaf(schema["properties"]["child"])


def test_depth_cap_boundary_is_inclusive():
    at_cap = _nested_properties(MAX_SCHEMA_DEPTH)
    past_cap = _nested_properties(MAX_SCHEMA_DEPTH + 1)
    _sanitize_schema(at_cap)
    _sanitize_schema(past_cap)
    assert "pattern" not in _leaf(at_cap)
    assert _leaf(past_cap)["pattern"] == "^z$"


def test_defs_additional_properties_not_and_prefix_items_traversed():
    schema = {
        "$defs": {"a": {"pattern": "a"}},
        "definitions": {"b": {"minimum": 1}},
        "additionalProperties": {"maximum": 2},
        "not": {"multipleOf": 3},
        "prefixItems": [{"exclusiveMinimum": 4}],
        "oneOf": [{"exclusiveMaximum": 5}],
        "allOf": [{"pattern": "c"}],
    }
    assert _sanitize_schema(schema) is True
    assert schema == {
        "$defs": {"a": {}},
        "definitions": {"b": {}},
        "additionalProperties": {},
        "not": {},
        "prefixItems": [{}],
        "oneOf": [{}],
        "allOf": [{}],
    }


def test_sanitize_schema_returns_false_when_untouched():
    schema = {"type": "object", "properties": {"n": {"type": "string", "maxLength": _LEN_CAP}}}
    assert _sanitize_schema(schema) is False
    assert schema["properties"]["n"]["maxLength"] == _LEN_CAP
