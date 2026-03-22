import logging
from typing import List, Optional

from ptune_sync.domain.my_task import MyTask
from ptune_sync.application.shared.integration.google_tasks.google_tasks_service import GoogleTasksService
from .task_order_builder import TaskOrderBuilder

logger = logging.getLogger("ptune_sync")


class TaskReorderService:
    """Reorder tasks in Google Tasks."""

    def __init__(self, service: GoogleTasksService):
        """Initialize reorder service."""
        self.service = service

    def reorder(
        self,
        list_name: str,
        local_tasks: List[MyTask],
        remote_tasks: List[MyTask],
    ) -> None:
        """Reorder remote tasks to match local order."""

        logger.debug("reorder start list=%s", list_name)

        local_map = TaskOrderBuilder.build_as_is(local_tasks)
        remote_map = TaskOrderBuilder.build_as_is(remote_tasks)

        all_parents = set(local_map.keys()) | set(remote_map.keys())

        for parent_id in all_parents:

            local_ids = self._extract_ids(local_map.get(parent_id, []))
            remote_ids = self._extract_ids(remote_map.get(parent_id, []))

            logger.debug("Parent=%s local=%s remote=%s", parent_id, local_ids, remote_ids)

            if local_ids == remote_ids:
                continue

            self._reorder_group(
                list_name,
                parent_id,
                local_map.get(parent_id, []),
            )

        logger.debug("=== reorder end ===")

    def _reorder_group(
        self,
        list_name: str,
        parent_id: Optional[str],
        ordered_tasks: List[MyTask],
    ) -> None:
        """Apply move operations for a task group."""

        for task in reversed(ordered_tasks):

            if not task.id:
                continue

            logger.debug("move task id=%s parent=%s", task.id, parent_id)
            self.service.move_task(
                list_name=list_name,
                task_id=task.id,
                parent=parent_id,
                previous=None,
            )

    @staticmethod
    def _extract_ids(tasks: List[MyTask]) -> List[str]:
        """Extract task ids."""
        return [t.id for t in tasks if t.id]