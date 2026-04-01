# src/ptune_sync/infrastructure/google/api_client.py
from typing import Optional, Any, Dict
import httpx
from ptune_sync.auth.token_service import TokenService
from ptune_sync.core.exceptions import AuthError, RemoteApiError

BASE_URL = "https://tasks.googleapis.com/tasks/v1"
DEFAULT_TIMEOUT = 30.0


class GoogleApiClient:
    def __init__(self):
        self._client = httpx.Client(
            base_url=BASE_URL,
            timeout=DEFAULT_TIMEOUT,
            headers={"Content-Type": "application/json"},
        )

    def _authorized_headers(self) -> Dict[str, str]:
        token = TokenService.get_valid_access_token()
        return {"Authorization": f"Bearer {token}"}

    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Any:

        try:
            response = self._client.request(
                method=method,
                url=path,
                params=params,
                json=json,
                headers=self._authorized_headers(),
            )
            response.raise_for_status()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                # refresh後再試行
                try:
                    headers = self._authorized_headers()
                    response = self._client.request(
                        method=method,
                        url=path,
                        params=params,
                        json=json,
                        headers=headers,
                    )
                    response.raise_for_status()
                except Exception as retry_error:
                    raise AuthError("Re-authentication required") from retry_error
            else:
                raise RemoteApiError(
                    f"Google API HTTP {e.response.status_code}"
                ) from e

        except httpx.RequestError as e:
            raise RemoteApiError(str(e)) from e

        if response.content:
            return response.json()
        return None

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()