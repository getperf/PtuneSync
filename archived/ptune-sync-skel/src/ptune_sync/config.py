# src/ptune_sync/config.py

import os
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional
from platformdirs import user_data_dir

load_dotenv()


# ============================================================
# Google OAuth 設定
# ============================================================

CLIENT_ID: str = os.environ["GOOGLE_CLIENT_ID"]
CLIENT_SECRET: str = os.environ["GOOGLE_CLIENT_SECRET"]
REDIRECT_URI: str = os.environ["GOOGLE_REDIRECT_URI"]
SCOPES: list[str] = [
    scope.strip() for scope in os.environ["GOOGLE_OAUTH_SCOPES"].split(",")
]


# ============================================================
# アプリケーションディレクトリ設定
# ============================================================

def resolve_app_dir() -> Path:
    env = os.getenv("PTUNE_SYNC_HOME")
    if env:
        return Path(env)

    return Path(user_data_dir("ptune-sync", "ptune"))

APP_DIR = resolve_app_dir()
EXPORT_DIR: Path = APP_DIR / "exports"
CACHE_DIR: Path = APP_DIR / "cache"
TOKEN_PATH: Path = APP_DIR / "token.json"

# SQLite DB
DB_PATH: Path = Path(
    os.getenv("PTUNE_SYNC_DB_PATH", APP_DIR / "ptune_sync.db")
)


# ============================================================
# 初期化
# ============================================================

def ensure_directories() -> None:
    """
    アプリケーションに必要なディレクトリを保証する。
    """

    APP_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # DBディレクトリ保証
    if DB_PATH.parent != Path("."):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db_path() -> str:
    """
    DBパスを文字列で取得する。
    将来の拡張（切替・テスト用差替）に備える。
    """
    ensure_directories()
    return str(DB_PATH)
