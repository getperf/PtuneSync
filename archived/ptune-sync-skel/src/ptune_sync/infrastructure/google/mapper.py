import re
from typing import List

from ptune_sync.domain.my_task import MyTask
from ptune_sync.infrastructure.google.dto import GoogleTaskDto


class GoogleTaskMapper:

    # ---------------------------------
    # DTO → Domain
    # ---------------------------------
    @staticmethod
    def to_domain(dto: GoogleTaskDto) -> MyTask:
        planned = None
        actual = None
        review_flags: List[str] = []
        started = None
        completed = dto.completed
        goal = None
        tags: List[str] = []

        if dto.notes:
            lines = dto.notes.splitlines()

            for line in lines:
                if line.startswith("🍅"):
                    m = re.search(r"planned=(\d+)", line)
                    if m:
                        planned = int(m.group(1))

                elif line.startswith("goal="):
                    goal = line.split("=", 1)[1]

                elif line.startswith("tags="):
                    raw = line.split("=", 1)[1]
                    tags = [t.strip() for t in raw.split(",") if t.strip()]

                elif line.startswith("actual="):
                    actual = float(line.split("=", 1)[1])

                elif line.startswith("started="):
                    started = line.split("=", 1)[1]

                elif line.startswith("reviewFlags="):
                    raw = line.split("=", 1)[1]
                    review_flags = [
                        f.strip() for f in raw.split(",") if f.strip()
                    ]

        task = MyTask.from_google_dto(dto)
        task.pomodoro_planned = planned
        task.pomodoro_actual = actual
        task.goal = goal
        task.tags = tags
        task.review_flags = review_flags
        task.started = started
        task.completed = completed
        
        task.normalize_tags()
        return task

    # ---------------------------------
    # Domain → DTO
    # ---------------------------------
    @staticmethod
    def to_dto(task: MyTask) -> GoogleTaskDto:
        lines: List[str] = []

        if task.pomodoro_planned is not None:
            lines.append(f"🍅planned={task.pomodoro_planned}")

        if task.goal:
            lines.append(f"goal={task.goal}")

        if task.tags:
            lines.append(f"tags={','.join(task.tags)}")

        if task.pomodoro_actual is not None:
            lines.append(f"actual={task.pomodoro_actual}")

        if task.started:
            lines.append(f"started={task.started}")

        if task.review_flags:
            lines.append(f"reviewFlags={','.join(task.review_flags)}")

        notes = "\n".join(lines) if lines else None

        return GoogleTaskDto(
            id=task.id or None,
            title=task.title,
            status=task.status,
            notes=notes,
            parent=task.parent,
            updated=task.google_updated_at,
        )
