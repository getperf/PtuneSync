from typing import List, Optional
from ptune_sync.infrastructure.google.api_client import GoogleApiClient
from ptune_sync.infrastructure.google.dto import GoogleTaskDto


class TasksApi:
    def __init__(self):
        self._client = GoogleApiClient()

    def list(self, list_id: str) -> List[GoogleTaskDto]:
        result: List[GoogleTaskDto] = []
        next_page_token: Optional[str] = None

        while True:
            params = {
                "showCompleted": "true",
                "showHidden": "true",
            }

            if next_page_token:
                params["pageToken"] = next_page_token

            data = self._client.request(
                "GET",
                f"/lists/{list_id}/tasks",
                params=params,
            )

            items = data.get("items", []) if data else []

            for item in items:
                result.append(
                    GoogleTaskDto(
                        id=item.get("id"),
                        title=item.get("title", ""),
                        status=item.get("status", "needsAction"),
                        notes=item.get("notes"),
                        parent=item.get("parent"),
                        due=item.get("due"),
                        completed=item.get("completed"),
                        updated=item.get("updated"),
                        deleted=item.get("deleted", False),
                        position=item.get("position"),
                    )
                )

            next_page_token = data.get("nextPageToken") if data else None

            if not next_page_token:
                break

        return result

    def add(self, list_id: str, dto: GoogleTaskDto) -> GoogleTaskDto:
        body = {
            "title": dto.title,
            "status": dto.status,
        }

        if dto.notes:
            body["notes"] = dto.notes
        if dto.parent:
            body["parent"] = dto.parent
        if dto.due:
            body["due"] = dto.due

        data = self._client.request(
            "POST",
            f"/lists/{list_id}/tasks",
            json=body,
        )

        return GoogleTaskDto(
            id=data.get("id"),
            title=data.get("title", ""),
            status=data.get("status", "needsAction"),
            notes=data.get("notes"),
            parent=data.get("parent"),
            due=data.get("due"),
            completed=data.get("completed"),
            updated=data.get("updated"),
            deleted=data.get("deleted", False),
        )

    def update(self, list_id: str, dto: GoogleTaskDto) -> None:
        body = {
            "title": dto.title,
            "status": dto.status,
        }

        if dto.notes:
            body["notes"] = dto.notes
        if dto.parent:
            body["parent"] = dto.parent
        if dto.due:
            body["due"] = dto.due

        self._client.request(
            "PATCH",
            f"/lists/{list_id}/tasks/{dto.id}",
            json=body,
        )

    def delete(self, list_id: str, task_id: str) -> None:
        self._client.request(
            "DELETE",
            f"/lists/{list_id}/tasks/{task_id}",
        )

    def move(
        self,
        list_id: str,
        task_id: str,
        parent: Optional[str] = None,
        previous: Optional[str] = None,
    ) -> None:
        params = {}
        if parent:
            params["parent"] = parent
        if previous:
            params["previous"] = previous

        self._client.request(
            "POST",
            f"/lists/{list_id}/tasks/{task_id}/move",
            params=params,
        )
