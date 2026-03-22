import logging
from typing import Any, Dict

from jsonschema import ValidationError

from ptune_sync.application.diff.push_diff_analyzer import PushDiffAnalyzer
from ptune_sync.core.exceptions import CliError
from ptune_sync.domain.my_task import MyTask
from ptune_sync.infrastructure.google.tasks_client import GoogleTasksClient
from .task_reorder_service import TaskReorderService

logger = logging.getLogger("ptune_sync")


class PushUseCase:
    """Push local tasks to Google Tasks."""

    def __init__(self, service=None):
        """Initialize PushUseCase."""
        from ptune_sync.application.shared.integration.google_tasks.google_tasks_service import GoogleTasksService

        self.service = service or GoogleTasksService()

        from .task_reorder_service import TaskReorderService
        self.reorder_service = TaskReorderService(self.service)

    def execute(self, payload, list_name, allow_delete=False):

        tasks = payload.get("tasks")
        local_tasks = [MyTask.from_dict(x) for x in tasks]

        remote_tasks = self.service.fetch_ordered(list_name)

        result = PushDiffAnalyzer.analyze(local_tasks, remote_tasks)

        self._apply_creates(result, list_name)
        self._apply_updates(result, list_name)

        if allow_delete:
            self._apply_deletes(result, list_name)

        self._resolve_parent_keys(local_tasks)

        self.reorder_service.reorder(
            list_name=list_name,
            local_tasks=local_tasks,
            remote_tasks=remote_tasks,
        )

        return result.summary()

    def _apply_creates(self, result, list_name):
        for task in reversed(result.to_create):
            created = self.service.add_task(list_name, task)
            task.id = created.id

    def _apply_updates(self, result, list_name):
        for task in result.to_update:
            self.service.update_task(list_name, task)

    def _apply_deletes(self, result, list_name):
        for task in result.to_delete:
            self.service.delete_task(list_name, task.id)

    def _resolve_parent_keys(self, tasks):
        title_map = {
            task.title: task.id
            for task in tasks
            if task.id
        }

        for task in tasks:
            if getattr(task, "parent_key", None):
                parent_id = title_map.get(task.parent_key)
                if parent_id:
                    task.parent = parent_id