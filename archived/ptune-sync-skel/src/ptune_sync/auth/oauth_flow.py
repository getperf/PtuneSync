# src/ptune_sync/auth/oauth_flow.py
from urllib.parse import urlencode
from datetime import datetime, timedelta
import logging
import webbrowser
import httpx

from .oauth_pkce import generate_pkce
from .local_server import wait_for_code
from ptune_sync.config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"

logger = logging.getLogger("ptune_sync.auth.oauth_flow")


class OAuthError(Exception):
    """OAuth処理に関する例外"""
    pass


def _build_auth_url(challenge: str) -> str:
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def _exchange_token(code: str, verifier: str) -> dict:
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
        "code_verifier": verifier,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(TOKEN_URL, data=data)
            response.raise_for_status()
            token_response = response.json()
    except httpx.HTTPError as e:
        logger.exception("Token exchange HTTP error")
        raise OAuthError(f"Token exchange failed: {str(e)}") from e

    if "error" in token_response:
        logger.error("OAuth error response: %s", token_response)
        raise OAuthError(token_response.get("error_description", "OAuth error"))

    return token_response


def _normalize_token_response(raw: dict) -> dict:
    """
    CLI層で保存・JSON出力しやすい形式へ正規化
    """
    expires_in = raw.get("expires_in")

    expires_at = None
    if expires_in:
        expires_at = (
            datetime.utcnow() + timedelta(seconds=int(expires_in))
        ).isoformat() + "Z"

    return {
        "access_token": raw.get("access_token"),
        "refresh_token": raw.get("refresh_token"),
        "token_type": raw.get("token_type"),
        "scope": raw.get("scope"),
        "expires_at": expires_at,
        # emailは別途userinfoで取得する設計も可（今回は未実装）
    }


def authenticate() -> dict:
    """
    OAuth認証フロー実行。
    stdoutへは出力しない。
    例外はOAuthErrorで送出。
    """
    logger.info("Starting OAuth authentication flow")

    verifier, challenge = generate_pkce()

    auth_url = _build_auth_url(challenge)

    logger.info("Opening browser for user authentication")
    webbrowser.open(auth_url)

    logger.info("Waiting for authorization code")
    code = wait_for_code()

    if not code:
        logger.error("Authorization code not received")
        raise OAuthError("Authorization code not received")

    logger.info("Authorization code received")

    raw_token = _exchange_token(code, verifier)
    normalized = _normalize_token_response(raw_token)

    logger.info("OAuth authentication successful")
    return normalized
