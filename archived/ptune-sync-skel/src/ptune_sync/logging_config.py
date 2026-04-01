# src/ptune_sync/logging_config.py

import logging
from pathlib import Path
import os
from platformdirs import user_data_dir


APP_NAME = "ptune-sync"
APP_AUTHOR = "ptune"

BASE_DIR = Path(user_data_dir(APP_NAME, APP_AUTHOR))
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = LOG_DIR / "ptune_sync.log"


def setup_logging() -> None:
    logger = logging.getLogger("ptune_sync")

    level_name = os.getenv("PTUNE_SYNC_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    logger.setLevel(level)

    # 既存ハンドラ削除（重要）
    logger.handlers.clear()

    handler = logging.FileHandler(LOG_FILE, encoding="utf-8")

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s - %(message)s"
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)

    # 子ロガーも出力させる
    logger.propagate = False

    logger.info("Logging initialized")
    logger.info("Log file: %s", LOG_FILE)