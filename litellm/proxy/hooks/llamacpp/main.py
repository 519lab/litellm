from typing import Any, Dict, Optional

from litellm.integrations.custom_logger import CustomLogger

LLAMACPP_API_BASE = "http://127.0.0.1:56669"
_LEN_CAP = 256

# Dropped unconditionally at every depth.
_STRIP_KEYS = frozenset({
    "pattern",
    "minimum", "maximum",
    "exclusiveMinimum", "exclusiveMaximum",
    "multipleOf",
})


def _sanitize_schema(schema: Any, depth: int = 0) -> None:
    if not isinstance(schema, dict):
        return
    for k in _STRIP_KEYS:
        schema.pop(k, None)
    # minLength/maxLength at the top-level parameters object are fine; clamp
    # only in nested sub-schemas where large values overflow the grammar.
    if depth > 0:
        for key in ("minLength", "maxLength"):
            val = schema.get(key)
            if isinstance(val, int) and val > _LEN_CAP:
                schema[key] = _LEN_CAP
    for key in ("properties", "$defs", "definitions"):
        if key in schema and isinstance(schema[key], dict):
            for sub in schema[key].values():
                _sanitize_schema(sub, depth + 1)
    for key in ("items", "additionalProperties"):
        val = schema.get(key)
        if isinstance(val, dict):
            _sanitize_schema(val, depth + 1)
    for key in ("anyOf", "oneOf", "allOf"):
        val = schema.get(key)
        if isinstance(val, list):
            for sub in val:
                _sanitize_schema(sub, depth + 1)
    not_val = schema.get("not")
    if isinstance(not_val, dict):
        _sanitize_schema(not_val, depth + 1)


class LlamaCppPatternStripper(CustomLogger):

    def _is_llamacpp(self, kwargs: Dict[str, Any]) -> bool:
        api_base = kwargs.get("api_base") or kwargs.get("litellm_params", {}).get("api_base", "")
        return isinstance(api_base, str) and api_base.startswith(LLAMACPP_API_BASE)

    async def async_pre_call_deployment_hook(
        self,
        kwargs: Dict[str, Any],
        call_type: Optional[Any],
    ) -> Optional[dict]:
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
                    _sanitize_schema(params)
                    modified = True

        rf = kwargs.get("response_format")
        if isinstance(rf, dict) and rf.get("type") == "json_schema":
            schema = rf.get("json_schema", {}).get("schema")
            if isinstance(schema, dict):
                _sanitize_schema(schema)
                modified = True

        return kwargs if modified else None


proxy_handler_instance = LlamaCppPatternStripper()
