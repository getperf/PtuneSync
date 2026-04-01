import uuid
import json
from typing import List, Optional

from ptune_sync.domain.my_task import MyTask
from ptune_sync.domain.task_history import TaskHistory
from ptune_sync.infrastructure.sqlite.row_mapper import (
    row_to_task_history,
)


class TaskHistoriesRepository:

    def __init__(self, conn):
        self._conn = conn

    # ---------------------------------
    # INSERT 1件
    # ---------------------------------
    def insert_snapshot(
        self,
        task: MyTask,
        snapshot_type: str,
        snapshot_at: str,
        sync_history_id: str,
        deleted_at: Optional[str] = None,
    ) -> None:

        history_id = str(uuid.uuid4())

        self._conn.execute(
            """
            INSERT INTO task_histories (
                history_id,
                task_id,
                title,
                status,
                parent,
                started,
                completed,
                pomodoro_planned,
                pomodoro_actual,
                review_flags_json,
                goal,
                tags_json,
                snapshot_at,
                snapshot_type,
                sync_history_id,
                deleted_at,
                google_updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                history_id,
                task.id,
                task.title,
                task.status,
                task.parent,
                task.started,
                task.completed,
                task.pomodoro_planned,
                task.pomodoro_actual,
                json.dumps(task.review_flags or []),
                task.goal,
                json.dumps(task.tags or []),
                snapshot_at,
                snapshot_type,
                sync_history_id,
                deleted_at,
                task.google_updated_at,   # ★ 追加
            ),
        )

    # --------------------------------------
    # INSERT 複数
    # --------------------------------------
    def insert_snapshots(
        self,
        tasks: List[MyTask],
        snapshot_type: str,
        snapshot_at: str,
        sync_history_id: str,
    ) -> None:

        with self._conn:
            for task in tasks:
                self.insert_snapshot(
                    task=task,
                    snapshot_type=snapshot_type,
                    snapshot_at=snapshot_at,
                    sync_history_id=sync_history_id,
                )
    # ---------------------------------
    # READ
    # ---------------------------------
    def list_by_task_id(
        self,
        task_id: str,
        limit: int = 50,
    ) -> List[TaskHistory]:

        cur = self._conn.execute(
            """
            SELECT * FROM task_histories
            WHERE task_id = ?
            ORDER BY snapshot_at DESC
            LIMIT ?
            """,
            (task_id, limit),
        )

        return [row_to_task_history(r) for r in cur.fetchall()]

    def list_by_sync(
        self,
        sync_history_id: str,
    ) -> List[TaskHistory]:

        cur = self._conn.execute(
            """
            SELECT * FROM task_histories
            WHERE sync_history_id = ?
            ORDER BY snapshot_at DESC
            """,
            (sync_history_id,),
        )

        return [row_to_task_history(r) for r in cur.fetchall()]
