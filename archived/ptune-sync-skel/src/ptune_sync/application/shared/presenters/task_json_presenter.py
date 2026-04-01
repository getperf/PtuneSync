# src/ptune_sync/application/pull/pull_presenter.py

from ptune_sync.domain.my_task import MyTask


class TaskJsonPresenter:

    @staticmethod
    def to_dict(task: MyTask) -> dict:
        return {
            "id": task.id,
            "title": task.title,
            "pomodoro_planned": task.pomodoro_planned,
            "pomodoro_actual": task.pomodoro_actual,
            "review_flags": task.review_flags or [],
            "started": task.started,
            "completed": task.completed,
            "status": task.status,
            "parent": task.parent,
            "tags": task.tags or [],
            "goal": task.goal,
        }
