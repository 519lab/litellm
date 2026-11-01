"""Client for the `other` holding-pen suite.

Holds the shared ProxyClient so `resources` / `scoped_key` still clean up, and adds only the routes these
behaviors need.
"""

from __future__ import annotations

from dataclasses import dataclass

from e2e_http import Result
from models import UserListParams, UserListResponse
from proxy_client import ProxyClient


@dataclass(frozen=True, slots=True)
class OtherClient:
    proxy: ProxyClient

    def list_users_as(self, key: str) -> Result[UserListResponse]:
        """GET /user/list under `key`. Admin-only, so a success proves `key` authenticated as a proxy admin."""
        return self.proxy.transport.get(
            "/user/list",
            headers=self.proxy.transport.bearer(key),
            params=UserListParams(user_ids="e2e-test-user"),
            response_type=UserListResponse,
        )


def build_client(proxy: ProxyClient) -> OtherClient:
    return OtherClient(proxy=proxy)
