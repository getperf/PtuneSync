# src/ptune_sync/auth/token_store.py

import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from ptune_sync.config import TOKEN_PATH, ensure_directories


class TokenStore:
    @staticmethod
    def load() -> Optional[Dict[str, Any]]:
        if not TOKEN_PATH.exists():
            return None
        return json.loads(TOKEN_PATH.read_text(encoding="utf-8"))

    @staticmethod
    def save(token_data: Dict[str, Any]) -> None:
        TOKEN_PATH.parent.mkdir(exist_ok=True)
        TOKEN_PATH.write_text(
            json.dumps(token_data, indent=2),
            encoding="utf-8",
        )

    @staticmethod
    def status() -> Dict[str, Any]:
        token = TokenStore.load()
        if not token:
            return {"authenticated": False}

        expires_at = token.get("expires_at")
        return {
            "authenticated": True,
            "email": token.get("email"),
            "expires_at": expires_at,
        }
