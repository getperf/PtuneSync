# src/ptune_sync/auth/token_repository.py
from pathlib import Path
import json
from typing import Optional, Dict, Any
from ptune_sync.config import TOKEN_PATH

class TokenRepository:
    @staticmethod
    def load() -> Optional[Dict[str, Any]]:
        if not TOKEN_PATH.exists():
            return None
        return json.loads(TOKEN_PATH.read_text())

    @staticmethod
    def save(token: Dict[str, Any]) -> None:
        TOKEN_PATH.write_text(json.dumps(token, indent=2))
