import os
from typing import Any

from litellm.integrations.custom_logger import CustomLogger
from litellm.types.utils import CallTypes

LLAMACPP_API_BASE = os.getenv("LLAMACPP_API_BASE", "http://127.0.0.1:56669")
_LEN_CAP = 256
MAX_SCHEMA_DEPTH: int = 20

_STRIP_KEYS = frozenset(
    {
        "pattern",
        "minimum",
        "maximum",
        "exclusiveMinimum",
        "exclusiveMaximum",
        "multipleOf",
    }
)


def _child_schemas(schema: dict) -> tuple[Any, ...]:
    mapped = tuple(
        sub
        for key in ("properties", "$defs", "definitions")
        if isinstance(schema.get(key), dict)
        for sub in schema[key].values()
    )
    listed = tuple(
        sub
        for key in ("items", "additionalProperties", "prefixItems", "anyOf", "oneOf", "allOf")
        if isinstance(schema.get(key), list)
        for sub in schema[key]
    )
    single = tuple(
        schema[key]
        for key in ("items", "additionalProperties", "not", "if", "then", "else")
        if isinstance(schema.get(key), dict)
    )
    return mapped + listed + single


def _sanitize_node(schema: dict, depth: int) -> bool:
    stripped = tuple(k for k in _STRIP_KEYS if k in schema)
    for k in stripped:
        del schema[k]
    capped = (
        tuple(
            key
            for key in ("minLength", "maxLength")
            if isinstance(schema.get(key), int) and schema[key] > _LEN_CAP
        )
        if depth > 0
        else ()
    )
    for key in capped:
        schema[key] = _LEN_CAP
    return bool(stripped or capped)


def _sanitize_schema(schema: dict, depth: int = 0) -> bool:
    """Strip llama.cpp-incompatible JSON Schema keywords in-place. Returns True if any change was made."""
    changed = False
    stack = [(schema, depth)]  # mutable-ok: explicit DFS stack replaces recursion banned by recursive_detector
    while stack:
        node, node_depth = stack.pop()
        if node_depth > MAX_SCHEMA_DEPTH or not isinstance(node, dict):
            continue
        changed = _sanitize_node(node, node_depth) or changed
        stack.extend((sub, node_depth + 1) for sub in _child_schemas(node))
    return changed


class LlamaCppPatternStripper(CustomLogger):
    def _is_llamacpp(self, kwargs: dict[str, Any]) -> bool:
        api_base = kwargs.get("api_base") or (kwargs.get("litellm_params") or {}).get("api_base", "")
        return isinstance(api_base, str) and api_base.startswith(LLAMACPP_API_BASE)

    async def async_pre_call_deployment_hook(
        self,
        kwargs: dict[str, Any],
        call_type: CallTypes | None,
    ) -> dict[str, Any] | None:
        if not self._is_llamacpp(kwargs):
            return None

        modified = False

        tools = kwargs.get("tools")
        if isinstance(tools, list):
            for tool in tools:
                if not isinstance(tool, dict) or tool.get("type") != "function":
                    continue
                params = tool.get("function", {}).get("parameters")
                if isinstance(params, dict):
                    if _sanitize_schema(params):
                        modified = True

        rf = kwargs.get("response_format")
        if isinstance(rf, dict) and rf.get("type") == "json_schema":
            schema = rf.get("json_schema", {}).get("schema")
            if isinstance(schema, dict):
                if _sanitize_schema(schema):
                    modified = True

        return kwargs if modified else None


proxy_handler_instance = LlamaCppPatternStripper()
