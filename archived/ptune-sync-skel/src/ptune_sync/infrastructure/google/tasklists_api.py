from typing import List
from ptune_sync.infrastructure.google.api_client import GoogleApiClient
from ptune_sync.infrastructure.google.dto import GoogleTaskListDto


class TaskListsApi:
    def __init__(self):
        self._client = GoogleApiClient()

    # GET /users/@me/lists
    def list(self) -> List[GoogleTaskListDto]:
        data = self._client.request("GET", "/users/@me/lists")
        items = data.get("items", []) if data else []

        return [
            GoogleTaskListDto(
                id=x.get("id", ""),
                title=x.get("title", ""),
                updated=x.get("updated"),
                description=x.get("description"),
            )
            for x in items
        ]

    # POST /users/@me/lists
    def create(self, title: str) -> GoogleTaskListDto:
        data = self._client.request(
            "POST",
            "/users/@me/lists",
            json={"title": title},
        )

        return GoogleTaskListDto(
            id=data.get("id", ""),
            title=data.get("title", ""),
            updated=data.get("updated"),
            description=data.get("description"),
        )

    # DELETE /users/@me/lists/{tasklist}
    def delete(self, list_id: str) -> None:
        self._client.request(
            "DELETE",
            f"/users/@me/lists/{list_id}",
        )
