# src/ptune_sync/application/push/task_order_builder.py

from collections import defaultdict
from typing import Dict, List, Optional

from ptune_sync.domain.my_task import MyTask
from ptune_sync.application.shared.services.task_tree_order_service import (
    TaskTreeOrderService,
)


class TaskOrderBuilder:
    """
    parent ごとの順序マップを生成する。

    - local: 入力順（payload順）をそのまま採用
    - remote: positionベースで正規化した上で採用（必要な場合のみ）
    """

    @staticmethod
    def build_as_is(tasks: List[MyTask]) -> Dict[Optional[str], List[MyTask]]:
        order_map: Dict[Optional[str], List[MyTask]] = defaultdict(list)
        for t in tasks:
            order_map[t.parent].append(t)
        return order_map

    @staticmethod
    def build_remote_normalized(tasks: List[MyTask]) -> Dict[Optional[str], List[MyTask]]:
        ordered = TaskTreeOrderService.rebuild(tasks)
        return TaskOrderBuilder.build_as_is(ordered)