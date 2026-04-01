from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class TaskHistory:
    history_id: str
    task_id: str

    # --- 基本情報 ---
    title: str
    status: str
    parent: Optional[str] = None

    # --- 登録系 ---
    pomodoro_planned: Optional[int] = None
    goal: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    # --- 実績系 ---
    started: Optional[str] = None
    completed: Optional[str] = None
    pomodoro_actual: Optional[float] = None
    review_flags: List[str] = field(default_factory=list)

    # --- スナップショット情報 ---
    snapshot_at: str = ""
    snapshot_type: str = ""
    sync_history_id: str = ""

    # --- 削除情報 ---
    deleted_at: Optional[str] = None

    # -------------------------------------------------
    # Utility
    # -------------------------------------------------
    @property
    def is_completed(self) -> bool:
        return self.status == "completed"

    def normalize_tags(self) -> None:
        self.tags = sorted(set(t.strip() for t in self.tags if t.strip()))

    def to_dict(self) -> dict:
        return {
            "history_id": self.history_id,
            "task_id": self.task_id,
            "title": self.title,
            "status": self.status,
            "parent": self.parent,
            "started": self.started,
            "completed": self.completed,
            "pomodoro_planned": self.pomodoro_planned,
            "pomodoro_actual": self.pomodoro_actual,
            "review_flags": self.review_flags,
            "goal": self.goal,
            "tags": self.tags,
            "snapshot_at": self.snapshot_at,
            "snapshot_type": self.snapshot_type,
            "sync_history_id": self.sync_history_id,
            "deleted_at": self.deleted_at,
        }
