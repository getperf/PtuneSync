from typing import List
from datetime import datetime
from ptune_sync.domain.my_task import MyTask
from ptune_sync.repositories.tasks_repository import TasksRepository


class TaskSyncService:

    def __init__(self, tasks_repo: TasksRepository):
        self.tasks_repo = tasks_repo

    def sync(self, tasks: List[MyTask], timestamp: str):
        self.tasks_repo.upsert_many(tasks, timestamp)
        ids = [t.id for t in tasks]
        if ids:
            self.tasks_repo.soft_delete_missing(ids, timestamp)

