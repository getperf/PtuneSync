from dataclasses import dataclass, field
from typing import Optional, List, Any, Dict


@dataclass
class MyTask:
    id: str
    title: str

    pomodoro_planned: Optional[int] = None
    goal: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    pomodoro_actual: Optional[float] = None
    review_flags: List[str] = field(default_factory=list)
    started: Optional[str] = None
    completed: Optional[str] = None

    status: str = "needsAction"

    parent: Optional[str] = None
    parent_key: Optional[str] = None

    google_updated_at: Optional[str] = None

    position: Optional[str] = None

    # =========================================================
    # Factory委譲
    # =========================================================
    @classmethod
    def from_dict(cls, obj: Dict[str, Any]) -> "MyTask":
        return _MyTaskFactory.from_dict(obj)

    @classmethod
    def from_row(cls, row: Any) -> "MyTask":
        return _MyTaskFactory.from_row(row)

    @classmethod
    def from_google_dto(cls, dto: Any) -> "MyTask":
        return _MyTaskFactory.from_google_dto(dto)

    # ---------- Utility ----------
    def normalize_tags(self) -> None:
        self.tags = sorted(set(t.strip() for t in self.tags if t.strip()))

    @property
    def is_completed(self) -> bool:
        return self.status == "completed"

    def to_dict(self) -> dict:
        """
        ⚠ position は外部公開しない
        既存CLI互換維持
        """
        return {
            "id": self.id,
            "title": self.title,
            "pomodoro_planned": self.pomodoro_planned,
            "pomodoro_actual": self.pomodoro_actual,
            "review_flags": self.review_flags,
            "started": self.started,
            "completed": self.completed,
            "status": self.status,
            "parent": self.parent,
            "parent_key": self.parent_key,
            "tags": self.tags,
            "goal": self.goal,
        }

    def equals_content(self, other: "MyTask") -> bool:
        """
        parent_key と position は比較対象外
        """
        return (
            self.title == other.title
            and self.parent == other.parent
            and self.status == other.status
            and self.tags == other.tags
            and self.goal == other.goal
            and self.pomodoro_planned == other.pomodoro_planned
            and self.pomodoro_actual == other.pomodoro_actual
            and self.review_flags == other.review_flags
            and self.started == other.started
            and self.completed == other.completed
        )


# =============================================================
# 内部Factory
# =============================================================
class _MyTaskFactory:

    @staticmethod
    def _create(
        *,
        id: str,
        title: str,
        pomodoro_planned: Optional[int],
        goal: Optional[str],
        tags: Optional[List[str]],
        pomodoro_actual: Optional[float],
        review_flags: Optional[List[str]],
        started: Optional[str],
        completed: Optional[str],
        status: Optional[str],
        parent: Optional[str],
        parent_key: Optional[str] = None,
        google_updated_at: Optional[str] = None,
        position: Optional[str] = None,
    ) -> MyTask:

        task = MyTask(
            id=id or "",
            title=title or "",
            pomodoro_planned=pomodoro_planned,
            goal=goal,
            tags=list(tags or []),
            pomodoro_actual=pomodoro_actual,
            review_flags=list(review_flags or []),
            started=started,
            completed=completed,
            status=status or "needsAction",
            parent=parent if parent not in ("", None) else None,
            parent_key=parent_key if parent_key not in ("", None) else None,
            google_updated_at=google_updated_at,
            position=position,
        )

        task.normalize_tags()
        return task

    @staticmethod
    def from_dict(obj: Dict[str, Any]) -> MyTask:
        return _MyTaskFactory._create(
            id=str(obj.get("id", "") or ""),
            title=str(obj.get("title", "") or ""),
            pomodoro_planned=obj.get("pomodoro_planned"),
            goal=obj.get("goal"),
            tags=obj.get("tags"),
            pomodoro_actual=obj.get("pomodoro_actual"),
            review_flags=obj.get("review_flags"),
            started=obj.get("started"),
            completed=obj.get("completed"),
            status=obj.get("status"),
            parent=obj.get("parent"),
            parent_key=obj.get("parent_key"),
            position=None,
        )

    @staticmethod
    def from_row(row: Any) -> MyTask:
        return _MyTaskFactory._create(
            id=row["id"],
            title=row["title"],
            pomodoro_planned=row["pomodoro_planned"],
            goal=row["goal"],
            tags=row.get("tags_json"),
            pomodoro_actual=row["pomodoro_actual"],
            review_flags=row.get("review_flags_json"),
            started=row["started"],
            completed=row["completed"],
            status=row["status"],
            parent=row["parent"],
            parent_key=None,
            position=None,
        )

    @staticmethod
    def from_google_dto(dto: Any) -> MyTask:
        return _MyTaskFactory._create(
            id=dto.id or "",
            title=dto.title,
            pomodoro_planned=getattr(dto, "planned", None),
            goal=getattr(dto, "goal", None),
            tags=getattr(dto, "tags", None),
            pomodoro_actual=getattr(dto, "actual", None),
            review_flags=getattr(dto, "review_flags", None),
            started=getattr(dto, "started", None),
            completed=getattr(dto, "completed", None),
            status=dto.status,
            parent=dto.parent,
            parent_key=None,
            google_updated_at=getattr(dto, "updated", None),
            position=getattr(dto, "position", None),
        )