from __future__ import annotations

from typing import List, Dict

from ptune_sync.application.shared.google_id import is_google_id
from ptune_sync.domain.my_task import MyTask
from ptune_sync.application.diff.push_check_result import PushCheckResult


class PushDiffAnalyzer:

    @staticmethod
    def analyze(
        local_tasks: List[MyTask],
        remote_tasks: List[MyTask],
    ) -> PushCheckResult:

        remote_by_id: Dict[str, MyTask] = {
            t.id: t for t in remote_tasks if is_google_id(t.id)
        }

        to_create: List[MyTask] = []
        to_update: List[MyTask] = []
        to_delete: List[MyTask] = []
        errors: List[str] = []
        warnings: List[str] = []

        # ----------------------------
        # create / update 判定
        # ----------------------------
        for local in local_tasks:

            if not is_google_id(local.id):
                # 仮IDまたはNone → create
                to_create.append(local)
                continue

            remote = remote_by_id.get(local.id)

            if not remote:
                # GoogleIDだがremoteに無い → 本当のエラー
                errors.append(f"Remote task missing: {local.id}")
                continue

            # ---------------------------------
            # completed 巻き戻し防止
            # ---------------------------------
            if (
                remote.completed
                and not local.completed
            ):
                warnings.append(
                    f"Skip reopen completed task: {local.title} ({local.id})"
                )
                continue

            # ---------------------------------
            # 通常 update 判定
            # ---------------------------------
            if not local.equals_content(remote):
                to_update.append(local)

        # ----------------------------
        # delete 判定
        # ----------------------------
        local_google_ids = {
            t.id for t in local_tasks if is_google_id(t.id)
        }

        for task_id, remote in remote_by_id.items():
            if task_id not in local_google_ids:
                to_delete.append(remote)

        return PushCheckResult(
            to_create=to_create,
            to_update=to_update,
            to_delete=to_delete,
            errors=errors,
            warnings=warnings,
        )