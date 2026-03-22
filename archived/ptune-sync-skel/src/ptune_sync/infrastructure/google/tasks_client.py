from typing import List, Optional
from ptune_sync.infrastructure.google.tasklists_api import TaskListsApi
from ptune_sync.infrastructure.google.tasks_api import TasksApi
from ptune_sync.infrastructure.google.dto import GoogleTaskDto, GoogleTaskListDto
from ptune_sync.infrastructure.google.mapper import GoogleTaskMapper
from ptune_sync.domain.my_task import MyTask
from ptune_sync.core.exceptions import ValidationError, RemoteApiError


class GoogleTasksClient:

    def __init__(self):
        self._tasklists_api = TaskListsApi()
        self._tasks_api = TasksApi()

        # -----------------------------------------
        # CACHE
        # -----------------------------------------
        self._tasklists_cache: Optional[List[GoogleTaskListDto]] = None

    # -----------------------------------------
    # INTERNAL
    # -----------------------------------------

    def _get_tasklists(self) -> List[GoogleTaskListDto]:
        """
        TaskLists をキャッシュ付きで取得
        """
        if self._tasklists_cache is None:
            self._tasklists_cache = self._tasklists_api.list()

        return self._tasklists_cache

    # -----------------------------------------
    # TASK LISTS
    # -----------------------------------------

    def list_tasklists(self) -> List[GoogleTaskListDto]:
        try:
            return self._get_tasklists()
        except Exception as e:
            raise RemoteApiError(str(e)) from e

    def create_tasklist(self, title: str) -> GoogleTaskListDto:
        try:
            created = self._tasklists_api.create(title)

            # cache 更新
            if self._tasklists_cache is not None:
                self._tasklists_cache.append(created)

            return created

        except Exception as e:
            raise RemoteApiError(str(e)) from e

    # -----------------------------------------
    # LIST RESOLUTION
    # -----------------------------------------

    def resolve_list_id(self, list_name: str) -> str:

        lists = self._get_tasklists()

        for lst in lists:
            if lst.title == list_name:
                return lst.id

        raise ValidationError(f"Task list '{list_name}' not found")

    # -----------------------------------------
    # FETCH
    # -----------------------------------------

    def list_all(self, list_name: str) -> List[MyTask]:
        try:
            list_id = self.resolve_list_id(list_name)

            dtos: List[GoogleTaskDto] = self._tasks_api.list(list_id)

            return [
                GoogleTaskMapper.to_domain(dto)
                for dto in dtos
                if not dto.deleted
            ]

        except Exception as e:
            raise RemoteApiError(str(e)) from e

    # -----------------------------------------
    # ADD
    # -----------------------------------------

    def add(self, list_name: str, task: MyTask) -> MyTask:
        try:
            list_id = self.resolve_list_id(list_name)

            dto = GoogleTaskMapper.to_dto(task)
            created = self._tasks_api.add(list_id, dto)

            return GoogleTaskMapper.to_domain(created)

        except Exception as e:
            raise RemoteApiError(str(e)) from e

    # -----------------------------------------
    # UPDATE
    # -----------------------------------------

    def update(self, list_name: str, task: MyTask) -> None:
        try:
            list_id = self.resolve_list_id(list_name)

            dto = GoogleTaskMapper.to_dto(task)

            if not dto.id:
                raise RuntimeError("Task ID required for update")

            self._tasks_api.update(list_id, dto)

        except Exception as e:
            raise RemoteApiError(str(e)) from e

    # -----------------------------------------
    # DELETE
    # -----------------------------------------

    def delete(self, list_name: str, task_id: str) -> None:
        try:
            list_id = self.resolve_list_id(list_name)

            self._tasks_api.delete(list_id, task_id)

        except Exception as e:
            raise RemoteApiError(str(e)) from e

    # -----------------------------------------
    # MOVE
    # -----------------------------------------

    def move(
        self,
        list_name: str,
        task_id: str,
        parent: Optional[str] = None,
        previous: Optional[str] = None,
    ) -> None:

        try:
            list_id = self.resolve_list_id(list_name)

            self._tasks_api.move(
                list_id=list_id,
                task_id=task_id,
                parent=parent,
                previous=previous,
            )

        except Exception as e:
            raise RemoteApiError(str(e)) from e