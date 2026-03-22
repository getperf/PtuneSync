from __future__ import annotations

from typing import Dict

from ptune_sync.domain.diff.diff_result import DiffResult
from ptune_sync.application.shared.presenters.task_json_presenter import TaskJsonPresenter


class DiffPresenter:

    @staticmethod
    def to_dict(result: DiffResult) -> Dict:
        return {
            "added": [
                TaskJsonPresenter.to_dict(t)
                for t in result.added
            ],
            "updated": [
                TaskJsonPresenter.to_dict(t)
                for t in result.updated
            ],
            "deleted": [
                TaskJsonPresenter.to_dict(t)
                for t in result.deleted
            ],
            "warnings": list(result.warnings),
        }