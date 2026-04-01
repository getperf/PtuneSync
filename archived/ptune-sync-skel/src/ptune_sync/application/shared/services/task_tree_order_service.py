from typing import List, Dict, Optional
from ptune_sync.domain.my_task import MyTask


class TaskTreeOrderService:
    """
    Google Tasks の position を基準に
    安定したツリー順序を生成する。
    """

    @staticmethod
    def rebuild(tasks: List[MyTask]) -> List[MyTask]:

        # --- position順に正規化 ---
        tasks_sorted = sorted(tasks, key=lambda t: t.position or "")

        parent_map: Dict[Optional[str], List[MyTask]] = {}

        for t in tasks_sorted:
            parent_map.setdefault(t.parent, []).append(t)

        ordered: List[MyTask] = []

        def walk(parent_id: Optional[str]) -> None:
            for task in parent_map.get(parent_id, []):
                ordered.append(task)
                walk(task.id)

        walk(None)

        return ordered