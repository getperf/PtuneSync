from datetime import datetime, timezone

from ptune_sync.application.shared.presenters.task_json_presenter import TaskJsonPresenter


class PullUseCase:

    def __init__(self, conn):
        from ptune_sync.repositories.tasks_repository import TasksRepository
        from ptune_sync.application.shared.integration.google_tasks.google_tasks_service import GoogleTasksService
        from ptune_sync.application.shared.integration.google_tasks.task_sync_service import TaskSyncService

        self.tasks_repo = TasksRepository(conn)
        self.fetch_service = GoogleTasksService()
        self.sync_service = TaskSyncService(self.tasks_repo)

    def execute(self, list_name: str, include_completed: bool):

        synced_at = datetime.now(timezone.utc).isoformat()

        tasks = self.fetch_service.fetch_ordered(list_name)
        self.sync_service.sync(tasks, synced_at)

        if not include_completed:
            tasks = [t for t in tasks if t.status != "completed"]

        return {
            "list": list_name,
            "exported_at": synced_at,
            "tasks": [
                TaskJsonPresenter.to_dict(t)
                for t in tasks
            ],
            "schema_version": 2,
        }
    