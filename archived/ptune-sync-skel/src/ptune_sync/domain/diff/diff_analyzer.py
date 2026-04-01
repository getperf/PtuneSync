from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict

from ptune_sync.domain.diff.diff_result import DiffResult
from ptune_sync.domain.my_task import MyTask


class DiffAnalyzer:
    @staticmethod
    def analyze(local_tasks: List[MyTask], remote_tasks: List[MyTask]) -> DiffResult:
        local_by_id: Dict[str, MyTask] = {t.id: t for t in local_tasks if getattr(t, "id", "")}
        remote_by_id: Dict[str, MyTask] = {t.id: t for t in remote_tasks if getattr(t, "id", "")}

        added = [t for t in local_tasks if not getattr(t, "id", "")]
        updated: List[MyTask] = []
        deleted: List[MyTask] = []

        # update: ID が両方に存在し、内容が違う
        for task_id, local in local_by_id.items():
            remote = remote_by_id.get(task_id)
            if not remote:
                # 今回は例外/警告は保留（スケルトン）
                continue
            if not local.equals_content(remote):
                updated.append(local)

        # delete: remote に存在し、local に存在しない
        for task_id, remote in remote_by_id.items():
            if task_id not in local_by_id:
                deleted.append(remote)

        return DiffResult(
            added=added,
            updated=updated,
            deleted=deleted,
            warnings=[],
        )