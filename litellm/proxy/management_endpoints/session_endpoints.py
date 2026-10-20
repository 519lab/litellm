"""
UI session revocation.

POST /session/logout — revoke the UI session key this request authenticated with.
revoke_ui_session_keys — revoke every UI session key a user holds (password writes).

Logging out of the dashboard was purely client-side (cookies cleared, redirect);
the DB-backed virtual key minted at login stayed valid until
LITELLM_UI_SESSION_DURATION elapsed, so a captured token kept working access
after logout, and changing a password did not invalidate existing sessions.

Deliberately NOT reusing /key/delete: its ownership checks can reject
low-privilege roles, and a self-revoke endpoint that takes no body cannot be
aimed at other keys.
"""

from typing import Annotated, Final

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from litellm._logging import verbose_proxy_logger
from litellm.constants import UI_SESSION_TOKEN_TEAM_ID
from litellm.proxy._types import (
    CommonProxyErrors,
    LiteLLM_VerificationToken,
    SessionLogoutResponse,
    UserAPIKeyAuth,
)
from litellm.proxy.auth.auth_checks import _delete_cache_key_object
from litellm.proxy.auth.user_api_key_auth import user_api_key_auth
from litellm.proxy.management_endpoints.key_management_endpoints import (
    _persist_deleted_verification_tokens,
)
from litellm.repositories.verification_token_repository import (
    VerificationTokenRepository,
)

router: Final = APIRouter()


def _to_verification_token(row: BaseModel) -> LiteLLM_VerificationToken:
    return LiteLLM_VerificationToken.model_validate(row.model_dump())


async def _revoke_tokens(
    rows: tuple[LiteLLM_VerificationToken, ...],
    user_api_key_dict: UserAPIKeyAuth,
    litellm_changed_by: str | None,
) -> tuple[str, ...]:
    from litellm.proxy.proxy_server import prisma_client, proxy_logging_obj, user_api_key_cache

    tokens: Final = tuple(row.token for row in rows if row.token is not None)
    if prisma_client is None or not tokens:
        return ()
    await _persist_deleted_verification_tokens(
        keys=list(rows),
        prisma_client=prisma_client,
        user_api_key_dict=user_api_key_dict,
        litellm_changed_by=litellm_changed_by,
    )
    await VerificationTokenRepository(prisma_client).table.delete_many(where={"token": {"in": list(tokens)}})
    for token in tokens:
        await _delete_cache_key_object(
            hashed_token=token,
            user_api_key_cache=user_api_key_cache,
            proxy_logging_obj=proxy_logging_obj,
        )
    return tokens


async def revoke_ui_session_keys(
    user_id: str,
    user_api_key_dict: UserAPIKeyAuth,
    *,
    keep_hashed_token: str | None = None,
    litellm_changed_by: str | None = None,
) -> int:
    """Revoke every UI session key belonging to ``user_id``, except
    ``keep_hashed_token`` (the caller's own session on a self-service password
    change; admin resets and onboarding claims revoke all).

    Best-effort: the password write this runs after has already committed, so a
    revocation failure is logged loudly rather than failing the request; the
    unrevoked keys still expire at LITELLM_UI_SESSION_DURATION.

    Returns the number of sessions revoked.
    """
    from litellm.proxy.proxy_server import prisma_client

    if prisma_client is None:
        return 0

    try:
        rows: Final = await VerificationTokenRepository(prisma_client).table.find_many(
            where={"user_id": user_id, "team_id": UI_SESSION_TOKEN_TEAM_ID}
        )
        revocable: Final = tuple(
            token
            for token in (_to_verification_token(row) for row in rows)
            if token.token is not None and token.token != keep_hashed_token
        )
        revoked: Final = await _revoke_tokens(revocable, user_api_key_dict, litellm_changed_by)
        if revoked:
            verbose_proxy_logger.info(
                "Revoked %s UI session key(s) for user_id=%s after password change", len(revoked), user_id
            )
        return len(revoked)
    except Exception:  # noqa: BLE001  # the password write committed; revocation must not undo that
        verbose_proxy_logger.exception(
            "Failed to revoke UI session keys for user_id=%s; existing sessions remain valid until they expire",
            user_id,
        )
        return 0


@router.post(
    "/session/logout",
    tags=["UI Session"],
)
async def session_logout(
    response: Response,
    user_api_key_dict: Annotated[UserAPIKeyAuth, Depends(user_api_key_auth)],
) -> SessionLogoutResponse:
    """
    Revoke the UI session key this request authenticated with.

    Only accepts UI session keys (minted by dashboard login); any other
    credential is refused, so this can never be used to delete arbitrary keys.
    Revokes only the presented session, not the user's other sessions.
    Idempotent: logging out an already-revoked session succeeds.
    """
    from litellm.proxy.proxy_server import prisma_client, proxy_logging_obj, user_api_key_cache

    if prisma_client is None:
        raise HTTPException(status_code=500, detail={"error": CommonProxyErrors.db_not_connected_error.value})

    if user_api_key_dict.team_id != UI_SESSION_TOKEN_TEAM_ID:
        raise HTTPException(
            status_code=403,
            detail={"error": "Only UI session tokens can be revoked through this endpoint."},
        )

    hashed_token: Final = user_api_key_dict.token
    row: Final = (
        None
        if hashed_token is None
        else await VerificationTokenRepository(prisma_client).table.find_unique(where={"token": hashed_token})
    )
    revoked: Final = (
        ()
        if row is None
        else await _revoke_tokens((_to_verification_token(row),), user_api_key_dict, litellm_changed_by=None)
    )
    if hashed_token is not None and not revoked:
        await _delete_cache_key_object(
            hashed_token=hashed_token,
            user_api_key_cache=user_api_key_cache,
            proxy_logging_obj=proxy_logging_obj,
        )

    response.delete_cookie("token")
    return SessionLogoutResponse(message="Session revoked." if revoked else "Session already revoked.")
