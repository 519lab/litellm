"""Regression tests for the configurable MCP gateway identity.

``LITELLM_MCP_SERVER_NAME`` and ``LITELLM_MCP_SERVER_DESCRIPTION`` are read from
the environment at import time in
``litellm.proxy._experimental.mcp_server.utils`` and must flow through to every
consumer, including the well-known registry entry built in
``mcp_management_endpoints``. The env values are reloaded into the modules, and each module's original
namespace is put back afterwards, so modules that imported names from them
(the MCP server manager raising MCPMissingUserEnvVarsError) keep matching.
"""

import contextlib
import importlib
import os

import pytest

pytest.importorskip("mcp")

UTILS_MODULE = "litellm.proxy._experimental.mcp_server.utils"
MGMT_MODULE = "litellm.proxy.management_endpoints.mcp_management_endpoints"


@contextlib.contextmanager
def _env_and_reload(**env):
    saved = {key: os.environ.get(key) for key in env}

    def _apply_env(values):
        for key, value in values.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    modules = tuple(importlib.import_module(name) for name in (UTILS_MODULE, MGMT_MODULE))
    namespaces = tuple(dict(vars(module)) for module in modules)

    try:
        _apply_env(env)
        yield tuple(importlib.reload(module) for module in modules)
    finally:
        _apply_env(saved)
        for module, namespace in zip(modules, namespaces):
            vars(module).clear()
            vars(module).update(namespace)


def test_defaults_used_when_env_unset():
    with _env_and_reload(
        LITELLM_MCP_SERVER_NAME=None, LITELLM_MCP_SERVER_DESCRIPTION=None
    ) as (utils, _mgmt):
        assert utils.LITELLM_MCP_SERVER_NAME == "litellm-mcp-server"
        assert utils.LITELLM_MCP_SERVER_DESCRIPTION == "MCP Server for LiteLLM"


def test_env_overrides_server_identity():
    with _env_and_reload(
        LITELLM_MCP_SERVER_NAME="acme-gateway",
        LITELLM_MCP_SERVER_DESCRIPTION="Acme internal MCP gateway",
    ) as (utils, _mgmt):
        assert utils.LITELLM_MCP_SERVER_NAME == "acme-gateway"
        assert utils.LITELLM_MCP_SERVER_DESCRIPTION == "Acme internal MCP gateway"


def test_env_override_propagates_to_registry_entry():
    with _env_and_reload(
        LITELLM_MCP_SERVER_NAME="acme-gateway",
        LITELLM_MCP_SERVER_DESCRIPTION="Acme internal MCP gateway",
    ) as (_utils, mgmt):
        entry = mgmt._build_builtin_registry_entry("http://localhost:4000")

    assert entry["name"] == "acme-gateway"
    assert entry["title"] == "acme-gateway"
    assert entry["description"] == "Acme internal MCP gateway"
