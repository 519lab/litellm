"""
Pre-call hook for LiteLLM proxy: sanitizes tool parameter schemas and
response_format.json_schema before requests reach the llama.cpp backend.

Known llama.cpp json_schema_to_grammar failure modes (all produce 400):
  - 'pattern' keyword (any value): Python-side conversion error.
  - numeric range keywords (minimum/maximum/…): grammar builder emits {n,m}
    GBNF quantifiers that the sampler's grammar parser then rejects.
  - large minLength/maxLength in nested sub-schemas: grammar expands to
    thousands of optional-char alternatives, exceeding the parser's limits;
    clamping to 256 is verified safe.

The hook is scoped to the llama.cpp api_base; other backends are unaffected.

Usage in config.yaml:
    litellm_settings:
      callbacks:
        - litellm.proxy.hooks.llamacpp.proxy_handler_instance
"""

from .main import LlamaCppPatternStripper, proxy_handler_instance

__all__ = ["LlamaCppPatternStripper", "proxy_handler_instance"]
