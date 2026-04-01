# src/ptune_sync/auth/token_service.py

import time
import httpx
from typing import Dict, Any
from ptune_sync.config import CLIENT_ID, CLIENT_SECRET
from ptune_sync.auth.token_repository import TokenRepository
from ptune_sync.core.exceptions import AuthError

TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"


class TokenService:

    @staticmethod
    def get_valid_access_token() -> str:
        token = TokenRepository.load()
        if not token:
            raise AuthError("No token found")

        if TokenService._is_expired(token):
            token = TokenService._refresh(token)

        return token["access_token"]

    @staticmethod
    def _is_expired(token: Dict[str, Any]) -> bool:
        expires_at = token.get("expires_at")
        if not expires_at:
            return True

        try:
            expires_at = float(expires_at)
        except (TypeError, ValueError):
            return True

        return time.time() > expires_at - 60

    @staticmethod
    def _refresh(token: Dict[str, Any]) -> Dict[str, Any]:
        refresh_token = token.get("refresh_token")
        if not refresh_token:
            raise AuthError("Refresh token missing")

        response = httpx.post(
            TOKEN_ENDPOINT,
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
        )

        if response.status_code != 200:
            raise AuthError("Failed to refresh token")

        data = response.json()

        # refresh_token は返らないことがあるため保持
        data["refresh_token"] = refresh_token

        # ★ ここを数値に統一
        data["expires_at"] = float(time.time() + data["expires_in"])

        TokenRepository.save(data)
        return data