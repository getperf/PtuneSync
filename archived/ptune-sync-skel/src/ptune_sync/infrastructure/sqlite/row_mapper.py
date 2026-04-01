import json
from typing import Any, Optional, List

from ptune_sync.domain.my_task import MyTask
from ptune_sync.domain.sync_history import SyncHistory
from ptune_sync.domain.task_history import TaskHistory


# --------------------------------------
# Utility
# --------------------------------------

def _parse_json_field(value: Optional[str]) -> List[str]:
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception:
        return [v.strip() for v in value.split(",") if v.strip()]


# --------------------------------------
# tasks
# --------------------------------------

def row_to_my_task(row: Any) -> MyTask:
    return MyTask.from_row(row)


# --------------------------------------
# sync_histories
# --------------------------------------

def row_to_sync_history(row: Any) -> SyncHistory:
    return SyncHistory(
        id=row["id"],
        executed_at=row["executed_at"],
        sync_type=row["sync_type"],
        total_tasks=row["total_tasks"],
        completed_tasks=row["completed_tasks"],
        deleted_tasks=row["deleted_tasks"],
        note=row["note"],
    )


# --------------------------------------
# task_histories
# --------------------------------------

def row_to_task_history(row: Any) -> TaskHistory:
    return TaskHistory(
        history_id=row["history_id"],
        task_id=row["task_id"],
        title=row["title"],
        status=row["status"],
        parent=row["parent"],
        started=row["started"],
        completed=row["completed"],
        pomodoro_planned=row["pomodoro_planned"],
        pomodoro_actual=row["pomodoro_actual"],
        review_flags=_parse_json_field(row["review_flags_json"]),
        goal=row["goal"],
        tags=_parse_json_field(row["tags_json"]),
        snapshot_at=row["snapshot_at"],
        snapshot_type=row["snapshot_type"],
        sync_history_id=row["sync_history_id"],
        deleted_at=row["deleted_at"],
    )
