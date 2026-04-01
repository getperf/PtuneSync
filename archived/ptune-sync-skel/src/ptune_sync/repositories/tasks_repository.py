from typing import List
from datetime import datetime

from ptune_sync.domain.my_task import MyTask
from ptune_sync.infrastructure.sqlite.row_mapper import row_to_my_task


class TasksRepository:

    def __init__(self, conn):
        self._conn = conn

    # ---------------------------------
    # UPSERT
    # ---------------------------------
    def upsert_many(self, tasks: List[MyTask], synced_at: str) -> None:
        with self._conn:
            for t in tasks:
                self._conn.execute(
                    """
                    INSERT INTO tasks (
                        id, title, status, parent,
                        started, completed,
                        pomodoro_planned, pomodoro_actual,
                        review_flags_json, goal, tags_json,
                        google_updated_at,
                        last_synced_at,
                        deleted_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title,
                        status=excluded.status,
                        parent=excluded.parent,
                        started=excluded.started,
                        completed=excluded.completed,
                        pomodoro_planned=excluded.pomodoro_planned,
                        pomodoro_actual=excluded.pomodoro_actual,
                        review_flags_json=excluded.review_flags_json,
                        goal=excluded.goal,
                        tags_json=excluded.tags_json,
                        google_updated_at=excluded.google_updated_at,
                        last_synced_at=excluded.last_synced_at,
                        deleted_at=NULL
                    """,
                    (
                        t.id,
                        t.title,
                        t.status,
                        t.parent,
                        t.started,
                        t.completed,
                        t.pomodoro_planned,
                        t.pomodoro_actual,
                        ",".join(t.review_flags),
                        t.goal,
                        ",".join(t.tags),
                        t.google_updated_at,
                        synced_at,
                    ),
                )

    # ---------------------------------
    # ソフトデリート（今回存在しなかったID）
    # ---------------------------------
    def soft_delete_missing(
        self,
        existing_ids: List[str],
        synced_at: str,
    ) -> None:

        placeholders = ",".join("?" for _ in existing_ids)

        with self._conn:
            self._conn.execute(
                f"""
                UPDATE tasks
                SET deleted_at = ?
                WHERE id NOT IN ({placeholders})
                AND deleted_at IS NULL
                """,
                [synced_at] + existing_ids,
            )

    # ---------------------------------
    # 単体削除
    # ---------------------------------
    def mark_deleted(self, task_id: str, deleted_at: str) -> None:
        with self._conn:
            self._conn.execute(
                """
                UPDATE tasks
                SET deleted_at = ?
                WHERE id = ?
                """,
                (deleted_at, task_id),
            )

    # ---------------------------------
    # READ系
    # ---------------------------------
    def list_active(self) -> List[MyTask]:
        cur = self._conn.execute(
            "SELECT * FROM tasks WHERE deleted_at IS NULL"
        )
        return [row_to_my_task(r) for r in cur.fetchall()]

    def list_incomplete(self) -> List[MyTask]:
        cur = self._conn.execute(
            """
            SELECT * FROM tasks
            WHERE deleted_at IS NULL
            AND status != 'completed'
            """
        )
        return [row_to_my_task(r) for r in cur.fetchall()]

    def list_completed(self) -> List[MyTask]:
        cur = self._conn.execute(
            """
            SELECT * FROM tasks
            WHERE deleted_at IS NULL
            AND status = 'completed'
            """
        )
        return [row_to_my_task(r) for r in cur.fetchall()]
