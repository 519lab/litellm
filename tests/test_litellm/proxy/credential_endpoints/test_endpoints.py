from unittest.mock import MagicMock

import pytest

import litellm
from litellm.proxy._types import ProxyException, UserAPIKeyAuth
from litellm.proxy.credential_endpoints import endpoints
from litellm.types.utils import CredentialItem


@pytest.fixture
def no_database(monkeypatch):
    monkeypatch.setattr("litellm.proxy.proxy_server.prisma_client", None)


@pytest.mark.asyncio
async def test_delete_credential_raises_when_the_delete_fails(no_database):
    with pytest.raises(ProxyException) as exc_info:
        await endpoints.delete_credential(
            request=MagicMock(),
            fastapi_response=MagicMock(),
            credential_name="openai-prod",
            user_api_key_dict=UserAPIKeyAuth(),
        )

    assert exc_info.value.code == "500"


@pytest.mark.asyncio
async def test_update_credential_raises_when_the_update_fails(no_database):
    with pytest.raises(ProxyException) as exc_info:
        await endpoints.update_credential(
            request=MagicMock(),
            fastapi_response=MagicMock(),
            credential_name="openai-prod",
            credential=CredentialItem(credential_name="openai-prod", credential_values={}, credential_info={}),
            user_api_key_dict=UserAPIKeyAuth(),
        )

    assert exc_info.value.code == "500"


@pytest.mark.asyncio
async def test_get_credentials_raises_when_listing_fails(monkeypatch):
    monkeypatch.setattr(litellm, "credential_list", [object()])

    with pytest.raises(ProxyException):
        await endpoints.get_credentials(
            request=MagicMock(),
            fastapi_response=MagicMock(),
            user_api_key_dict=UserAPIKeyAuth(),
        )
