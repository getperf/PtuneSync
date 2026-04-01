from typing import List, Optional
from ptune_sync.infrastructure.google.tasks_client import GoogleTasksClient
from ptune_sync.domain.my_task import MyTask
from ...services.task_tree_order_service import TaskTreeOrderService


class GoogleTasksService:
    """Application service for Google Tasks operations."""

    def __init__(self, client=None):
        """Initialize service with optional client."""
        self.client = client or GoogleTasksClient()
        self._ensured_lists = set()

    def ensure_task_list(self, name: str) -> str:
        """Ensure a task list exists and return its ID."""

        if name in self._ensured_lists:
            return self.client.resolve_list_id(name)

        lists = self.client.list_tasklists()

        for lst in lists:
            if lst.title == name:
                self._ensured_lists.add(name)
                return lst.id

        created = self.client.create_tasklist(name)

        self._ensured_lists.add(name)

        return created.id

    def fetch_ordered(self, list_name: str) -> List[MyTask]:
        """Fetch tasks and rebuild hierarchy."""

        self.ensure_task_list(list_name)

        tasks = self.client.list_all(list_name)

        return TaskTreeOrderService.rebuild(tasks)

    def add_task(self, list_name: str, task: MyTask) -> MyTask:
        """Add a task to Google Tasks."""
        self.ensure_task_list(list_name)
        return self.client.add(list_name, task)

    def update_task(self, list_name: str, task: MyTask) -> None:
        """Update a task in Google Tasks."""
        self.ensure_task_list(list_name)
        self.client.update(list_name, task)

    def delete_task(self, list_name: str, task_id: str) -> None:
        """Delete a task from Google Tasks."""
        self.ensure_task_list(list_name)
        self.client.delete(list_name, task_id)

    def move_task(
        self,
        list_name: str,
        task_id: str,
        parent: Optional[str] = None,
        previous: Optional[str] = None,
    ) -> None:
        """Move a task in Google Tasks."""
        self.ensure_task_list(list_name)
        self.client.move(
            list_name=list_name,
            task_id=task_id,
            parent=parent,
            previous=previous,
        )