from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException, Response

from litellm.constants import UI_SESSION_TOKEN_TEAM_ID
from litellm.proxy._types import LiteLLM_VerificationToken, UserAPIKeyAuth
from litellm.proxy.management_endpoints.session_endpoints import (
    revoke_ui_session_keys,
    session_logout,
)

HASHED_TOKEN = "hashed-session-token"
USER_ID = "user-123"
SESSION_MODULE = "litellm.proxy.management_endpoints.session_endpoints"


def _session_row(token: str = HASHED_TOKEN, user_id: str = USER_ID) -> LiteLLM_VerificationToken:
    return LiteLLM_VerificationToken(token=token, team_id=UI_SESSION_TOKEN_TEAM_ID, user_id=user_id)


def _make_prisma(
    find_unique_row: LiteLLM_VerificationToken | None = None,
    find_many_rows: list[LiteLLM_VerificationToken] | None = None,
) -> MagicMock:
    prisma = MagicMock()
    table = prisma.db.litellm_verificationtoken
    table.find_unique = AsyncMock(return_value=find_unique_row)
    table.find_many = AsyncMock(return_value=find_many_rows or [])
    table.delete_many = AsyncMock(return_value=1)
    return prisma


def _ui_session_caller(token: str | None = HASHED_TOKEN) -> UserAPIKeyAuth:
    return UserAPIKeyAuth(token=token, team_id=UI_SESSION_TOKEN_TEAM_ID, user_id=USER_ID)


@pytest.fixture
def proxy_globals():
    def _apply(prisma: MagicMock):
        return (
            patch("litellm.proxy.proxy_server.prisma_client", prisma),
            patch("litellm.proxy.proxy_server.proxy_logging_obj", None),
            patch("litellm.proxy.proxy_server.user_api_key_cache", MagicMock()),
            patch(f"{SESSION_MODULE}._persist_deleted_verification_tokens", AsyncMock()),
            patch(f"{SESSION_MODULE}._delete_cache_key_object", AsyncMock()),
        )

    return _apply


def _deleted_tokens(prisma: MagicMock) -> list[str]:
    delete_many = prisma.db.litellm_verificationtoken.delete_many
    if not delete_many.await_count:
        return []
    return list(delete_many.await_args.kwargs["where"]["token"]["in"])


@pytest.mark.asyncio
async def test_session_logout_revokes_presented_session_and_evicts_cache(proxy_globals):
    prisma = _make_prisma(find_unique_row=_session_row())
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist as persist, p_evict as evict:
        result = await session_logout(response=Response(), user_api_key_dict=_ui_session_caller())

    assert result.message == "Session revoked."
    assert _deleted_tokens(prisma) == [HASHED_TOKEN]
    assert [row.token for row in persist.await_args.kwargs["keys"]] == [HASHED_TOKEN]
    assert [c.kwargs["hashed_token"] for c in evict.await_args_list] == [HASHED_TOKEN]


@pytest.mark.asyncio
async def test_session_logout_clears_token_cookie(proxy_globals):
    prisma = _make_prisma(find_unique_row=_session_row())
    fastapi_response = Response()
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)
    with p_prisma, p_logging, p_cache, p_persist, p_evict:
        await session_logout(response=fastapi_response, user_api_key_dict=_ui_session_caller())

    set_cookie_headers = [v.decode() for k, v in fastapi_response.raw_headers if k == b"set-cookie"]
    assert any(h.startswith(('token="";', "token=;")) for h in set_cookie_headers)


@pytest.mark.asyncio
async def test_session_logout_refuses_non_ui_session_key(proxy_globals):
    prisma = _make_prisma(find_unique_row=_session_row())
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist, p_evict:
        with pytest.raises(HTTPException) as exc_info:
            await session_logout(
                response=Response(),
                user_api_key_dict=UserAPIKeyAuth(token=HASHED_TOKEN, team_id="some-real-team", user_id=USER_ID),
            )

    assert exc_info.value.status_code == 403
    prisma.db.litellm_verificationtoken.delete_many.assert_not_called()


@pytest.mark.asyncio
async def test_session_logout_is_idempotent_and_still_evicts_cache(proxy_globals):
    prisma = _make_prisma(find_unique_row=None)
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist, p_evict as evict:
        result = await session_logout(response=Response(), user_api_key_dict=_ui_session_caller())

    assert result.message == "Session already revoked."
    prisma.db.litellm_verificationtoken.delete_many.assert_not_called()
    assert [c.kwargs["hashed_token"] for c in evict.await_args_list] == [HASHED_TOKEN]


@pytest.mark.asyncio
async def test_revoke_ui_session_keys_queries_only_the_users_ui_sessions_and_keeps_the_caller(proxy_globals):
    rows = [_session_row("keep-me"), _session_row("stolen-1"), _session_row("stolen-2")]
    prisma = _make_prisma(find_many_rows=rows)
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist, p_evict as evict:
        revoked = await revoke_ui_session_keys(
            user_id=USER_ID, user_api_key_dict=_ui_session_caller("keep-me"), keep_hashed_token="keep-me"
        )

    assert revoked == 2
    assert prisma.db.litellm_verificationtoken.find_many.await_args.kwargs["where"] == {
        "user_id": USER_ID,
        "team_id": UI_SESSION_TOKEN_TEAM_ID,
    }
    assert _deleted_tokens(prisma) == ["stolen-1", "stolen-2"]
    assert [c.kwargs["hashed_token"] for c in evict.await_args_list] == ["stolen-1", "stolen-2"]


@pytest.mark.asyncio
async def test_revoke_ui_session_keys_without_keep_revokes_everything(proxy_globals):
    prisma = _make_prisma(find_many_rows=[_session_row("a"), _session_row("b")])
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist, p_evict:
        revoked = await revoke_ui_session_keys(user_id=USER_ID, user_api_key_dict=UserAPIKeyAuth())

    assert revoked == 2
    assert _deleted_tokens(prisma) == ["a", "b"]


@pytest.mark.asyncio
async def test_revoke_ui_session_keys_failure_does_not_raise(proxy_globals):
    prisma = _make_prisma(find_many_rows=[_session_row("a")])
    prisma.db.litellm_verificationtoken.delete_many = AsyncMock(side_effect=RuntimeError("db down"))
    p_prisma, p_logging, p_cache, p_persist, p_evict = proxy_globals(prisma)

    with p_prisma, p_logging, p_cache, p_persist, p_evict:
        revoked = await revoke_ui_session_keys(user_id=USER_ID, user_api_key_dict=UserAPIKeyAuth())

    assert revoked == 0
