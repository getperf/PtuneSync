from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict

from ptune_sync.domain.my_task import MyTask


@dataclass
class DiffResult:
    added: List[MyTask]
    updated: List[MyTask]
    deleted: List[MyTask]
    warnings: List[str]

    def to_dict(self) -> dict:
        def task_to_dict(t: MyTask) -> dict:
            # 既存 to_dict があるならそちらを使ってください。
            return {
                "id": getattr(t, "id", ""),
                "title": getattr(t, "title", ""),
                "parent": getattr(t, "parent", None),
                "pomodoro_planned": getattr(t, "pomodoro_planned", None),
                "pomodoro_actual": getattr(t, "pomodoro_actual", None),
                "review_flags": getattr(t, "review_flags", []) or [],
                "started": getattr(t, "started", None),
                "completed": getattr(t, "completed", None),
                "status": getattr(t, "status", "needsAction"),
                "tags": getattr(t, "tags", []) or [],
                "goal": getattr(t, "goal", None),
            }

        return {
            "added": [task_to_dict(t) for t in self.added],
            "updated": [task_to_dict(t) for t in self.updated],
            "deleted": [task_to_dict(t) for t in self.deleted],
            "warnings": list(self.warnings),
        }

