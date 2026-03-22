import uuid
from typing import List, Optional

from ptune_sync.domain.sync_history import SyncHistory
from ptune_sync.infrastructure.sqlite.row_mapper import (
    row_to_sync_history,
)


class SyncHistoriesRepository:

    def __init__(self, conn):
        self._conn = conn

    # ---------------------------------
    # CREATE
    # ---------------------------------
    def create(
        self,
        sync_type: str,
        executed_at: str,
        note: Optional[str] = None,
    ) -> SyncHistory:

        sync_id = str(uuid.uuid4())

        with self._conn:
            self._conn.execute(
                """
                INSERT INTO sync_histories (
                    id, executed_at, sync_type,
                    total_tasks, completed_tasks,
                    deleted_tasks, note
                )
                VALUES (?, ?, ?, 0, 0, 0, ?)
                """,
                (sync_id, executed_at, sync_type, note),
            )

        return SyncHistory(
            id=sync_id,
            executed_at=executed_at,
            sync_type=sync_type,
            note=note,
        )

    # ---------------------------------
    # COMPLETE
    # ---------------------------------
    def complete(
        self,
        sync_history_id: str,
        total_tasks: int,
        completed_tasks: int,
        deleted_tasks: int,
        note: Optional[str] = None,
    ) -> None:

        with self._conn:
            self._conn.execute(
                """
                UPDATE sync_histories
                SET total_tasks = ?,
                    completed_tasks = ?,
                    deleted_tasks = ?,
                    note = ?
                WHERE id = ?
                """,
                (
                    total_tasks,
                    completed_tasks,
                    deleted_tasks,
                    note,
                    sync_history_id,
                ),
            )

    # ---------------------------------
    # READ
    # ---------------------------------
    def get_by_id(self, sync_id: str) -> Optional[SyncHistory]:
        cur = self._conn.execute(
            "SELECT * FROM sync_histories WHERE id = ?",
            (sync_id,),
        )
        row = cur.fetchone()
        return row_to_sync_history(row) if row else None

    def list_recent(self, limit: int = 30) -> List[SyncHistory]:
        cur = self._conn.execute(
            """
            SELECT * FROM sync_histories
            ORDER BY executed_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [row_to_sync_history(r) for r in cur.fetchall()]
