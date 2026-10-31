from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from litellm.proxy.auth.oauth2_check import Oauth2Handler

INTROSPECT_URL = "https://idp.example.com/oauth2/introspect"
USERINFO_URL = "https://idp.example.com/oauth2/userinfo"
TOKEN = "sk-oauth-secret-token-value"


def _client_returning(body: dict[str, object], url: str) -> AsyncMock:
    response = httpx.Response(200, json=body, request=httpx.Request("POST", url))
    client = AsyncMock()
    client.post.return_value = response
    client.get.return_value = response
    return client


@pytest.fixture
def introspection_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OAUTH_TOKEN_INFO_ENDPOINT", INTROSPECT_URL)
    monkeypatch.setenv("OAUTH_CLIENT_ID", "client-id")
    monkeypatch.setenv("OAUTH_CLIENT_SECRET", "client-secret")


async def _check(client: AsyncMock, logger: MagicMock | None = None):
    with (
        patch("litellm.proxy.proxy_server.premium_user", True),
        patch("litellm.proxy.auth.oauth2_check.get_async_httpx_client", return_value=client),
        patch("litellm.proxy.auth.oauth2_check.verbose_proxy_logger", logger or MagicMock()),
    ):
        return await Oauth2Handler.check_oauth2_token(token=TOKEN)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "body",
    [
        {"sub": "user-1", "role": "proxy_admin"},
        {"active": False, "sub": "user-1"},
        {"active": "false", "sub": "user-1"},
        {"active": "true", "sub": "user-1"},
        {"active": 1, "sub": "user-1"},
        {"active": None, "sub": "user-1"},
    ],
    ids=["missing", "false", "string-false", "string-true", "int-1", "null"],
)
async def test_introspection_rejects_unless_active_is_true(introspection_env: None, body: dict[str, object]):
    client = _client_returning(body, INTROSPECT_URL)

    with pytest.raises(ValueError, match="Token is not active"):
        await _check(client)

    client.post.assert_awaited_once()


@pytest.mark.asyncio
async def test_introspection_accepts_active_true(introspection_env: None):
    client = _client_returning({"active": True, "sub": "user-1", "team_id": "team-1"}, INTROSPECT_URL)

    result = await _check(client)

    assert (result.user_id, result.team_id) == ("user-1", "team-1")


@pytest.mark.asyncio
async def test_token_info_get_endpoint_does_not_require_active(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OAUTH_TOKEN_INFO_ENDPOINT", USERINFO_URL)
    monkeypatch.delenv("OAUTH_CLIENT_ID", raising=False)
    monkeypatch.delenv("OAUTH_CLIENT_SECRET", raising=False)
    client = _client_returning({"sub": "user-1"}, USERINFO_URL)

    result = await _check(client)

    assert result.user_id == "user-1"
    client.get.assert_awaited_once()
    client.post.assert_not_awaited()


@pytest.mark.asyncio
async def test_raw_token_is_never_logged(introspection_env: None):
    client = _client_returning({"active": True, "sub": "user-1"}, INTROSPECT_URL)
    logger = MagicMock()

    await _check(client, logger)

    logged = repr(logger.mock_calls)
    assert logger.debug.call_count > 0
    assert TOKEN not in logged
