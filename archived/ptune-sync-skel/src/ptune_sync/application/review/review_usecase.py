# src/ptune_sync/application/review/review_usecase.py

from datetime import datetime, timezone

from ptune_sync.application.shared.presenters.task_json_presenter import TaskJsonPresenter
from ptune_sync.repositories.task_histories_repository import TaskHistoriesRepository
from ptune_sync.repositories.sync_histories_repository import SyncHistoriesRepository


class ReviewUseCase:

    def __init__(self, conn):
        from ptune_sync.repositories.tasks_repository import TasksRepository
        from ptune_sync.application.shared.integration.google_tasks.google_tasks_service import GoogleTasksService
        from ptune_sync.application.shared.integration.google_tasks.task_sync_service import TaskSyncService

        self.tasks_repo = TasksRepository(conn)
        self.fetch_service = GoogleTasksService()
        self.sync_service = TaskSyncService(self.tasks_repo)
        self.histories_repo = TaskHistoriesRepository(conn)
        self.sync_repo = SyncHistoriesRepository(conn)

    def execute(self, list_name: str):

        executed_at = datetime.now(timezone.utc).isoformat()

        sync = self.sync_repo.create(
            sync_type="review",
            executed_at=executed_at,
        )

        tasks = self.fetch_service.fetch_ordered(list_name)
        self.sync_service.sync(tasks, executed_at)

        self.histories_repo.insert_snapshots(
            tasks=tasks,
            snapshot_type="review",
            snapshot_at=executed_at,
            sync_history_id=sync.id,
        )

        self.sync_repo.complete(
            sync.id,
            total_tasks=len(tasks),
            completed_tasks=len([t for t in tasks if t.status == "completed"]),
            deleted_tasks=0,
        )

        return {
            "list": list_name,
            "exported_at": executed_at,
            "tasks": [
                TaskJsonPresenter.to_dict(t)
                for t in tasks
            ],
            "schema_version": 2,
        }