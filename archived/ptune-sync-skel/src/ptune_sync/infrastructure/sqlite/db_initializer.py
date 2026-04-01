# src/ptune_sync/infrastructure/sqlite/db_initializer.py

import logging
import sqlite3
from pathlib import Path
from typing import Optional

from ptune_sync.domain.versioning import VersionManager

logger = logging.getLogger("ptune_sync.cli.auth")

class DatabaseInitializer:
    """
    DB 初期化 + schema version 管理
    """

    def __init__(self, db_path: str):
        self.db_path = db_path

    # ==========================================================
    # Public
    # ==========================================================

    def ensure(self) -> None:
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("PRAGMA foreign_keys = ON;")

            current_version = self._get_current_version(conn)
            target_version = VersionManager.CURRENT_VERSION

            if current_version is None:
                self._initialize_schema(conn)
                self._set_version(conn, target_version)
                conn.commit()
                logger.info(f"[DB] initialized (version={target_version})")

            elif current_version < target_version:
                self._migrate(conn, current_version, target_version)
                conn.commit()
                logger.info(f"[DB] migrated to version={target_version}")

            else:
                logger.info(f"[DB] schema OK (version={current_version})")

        finally:
            conn.close()

    # ==========================================================
    # Private
    # ==========================================================

    def _get_current_version(self, conn: sqlite3.Connection) -> Optional[int]:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='schema_version';
            """
        )
        if cursor.fetchone() is None:
            return None

        cursor.execute("SELECT version FROM schema_version LIMIT 1;")
        row = cursor.fetchone()
        return row[0] if row else None

    def _initialize_schema(self, conn: sqlite3.Connection) -> None:
        schema_path = Path(__file__).parent / "schema.sql"
        schema_sql = schema_path.read_text(encoding="utf-8")
        conn.executescript(schema_sql)

    def _set_version(self, conn: sqlite3.Connection, version: int) -> None:
        conn.execute("DELETE FROM schema_version;")
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?);",
            (version,),
        )

    def _migrate(
        self,
        conn: sqlite3.Connection,
        current_version: int,
        target_version: int,
    ) -> None:
        version = current_version

        while version < target_version:
            next_version = version + 1

            # 例: v1 → v2
            if next_version == 2:
                # tags, goal 追加時の ALTER 追加
                self._migrate_v1_to_v2(conn)

            if next_version == 3:
                self._migrate_v2_to_v3(conn)
 
            version = next_version

        self._set_version(conn, target_version)


    def _migrate_v1_to_v2(self, conn: sqlite3.Connection) -> None:
        logger.info("[DB] migrating v1 -> v2")

        # tasks に追加
        conn.execute("ALTER TABLE tasks ADD COLUMN goal TEXT;")
        conn.execute("ALTER TABLE tasks ADD COLUMN tags_json TEXT;")

        # task_histories に追加
        conn.execute("ALTER TABLE task_histories ADD COLUMN goal TEXT;")
        conn.execute("ALTER TABLE task_histories ADD COLUMN tags_json TEXT;")

    def _migrate_v2_to_v3(self, conn: sqlite3.Connection) -> None:
        logger.info("[DB] migrating v2 -> v3")

        # task_histories に google_updated_at 追加
        conn.execute(
            "ALTER TABLE task_histories ADD COLUMN google_updated_at TEXT;"
        )