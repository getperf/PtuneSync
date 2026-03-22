from __future__ import annotations

from typing import Dict, Any

from ptune_sync.domain.my_task import MyTask
from ptune_sync.application.diff.push_diff_analyzer import PushDiffAnalyzer
from ptune_sync.application.shared.integration.google_tasks.google_tasks_service import (
    GoogleTasksService,
)
from ptune_sync.core.exceptions import ValidationError


class DiffUseCase:
    """Compute differences between local tasks and remote Google Tasks."""

    def __init__(self, service: GoogleTasksService | None = None):
        """Initialize with optional GoogleTasksService."""
        self.service = service or GoogleTasksService()

    def execute(self, payload: Dict[str, Any], list_name: str):
        """Analyze task differences."""

        tasks = payload.get("tasks")

        if tasks is None:
            raise ValidationError("missing 'tasks'")

        if not isinstance(tasks, list):
            raise ValidationError("'tasks' must be an array")

        local_tasks = [MyTask.from_dict(x) for x in tasks]

        remote_tasks = self.service.fetch_ordered(list_name)

        return PushDiffAnalyzer.analyze(local_tasks, remote_tasks)