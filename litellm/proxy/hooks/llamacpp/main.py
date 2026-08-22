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


def _sanitize_schema(schema: dict, depth: int = 0) -> bool:
    """Strip llama.cpp-incompatible JSON Schema keywords in-place. Returns True if any change was made."""
    if depth > MAX_SCHEMA_DEPTH:
        return False
    if not isinstance(schema, dict):
        return False
    changed = False
    for k in _STRIP_KEYS:
        if k in schema:
            del schema[k]
            changed = True
    if depth > 0:
        for key in ("minLength", "maxLength"):
            val = schema.get(key)
            if isinstance(val, int) and val > _LEN_CAP:
                schema[key] = _LEN_CAP
                changed = True
    for key in ("properties", "$defs", "definitions"):
        if key in schema and isinstance(schema[key], dict):
            for sub in schema[key].values():
                if _sanitize_schema(sub, depth + 1):
                    changed = True
    for key in ("items", "additionalProperties"):
        val = schema.get(key)
        if isinstance(val, dict):
            if _sanitize_schema(val, depth + 1):
                changed = True
        elif isinstance(val, list):
            for sub in val:
                if _sanitize_schema(sub, depth + 1):
                    changed = True
    prefix = schema.get("prefixItems")
    if isinstance(prefix, list):
        for sub in prefix:
            if _sanitize_schema(sub, depth + 1):
                changed = True
    for key in ("anyOf", "oneOf", "allOf"):
        val = schema.get(key)
        if isinstance(val, list):
            for sub in val:
                if _sanitize_schema(sub, depth + 1):
                    changed = True
    not_val = schema.get("not")
    if isinstance(not_val, dict):
        if _sanitize_schema(not_val, depth + 1):
            changed = True
    for key in ("if", "then", "else"):
        val = schema.get(key)
        if isinstance(val, dict):
            if _sanitize_schema(val, depth + 1):
                changed = True
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
