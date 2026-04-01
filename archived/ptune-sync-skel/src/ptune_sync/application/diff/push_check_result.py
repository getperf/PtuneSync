from dataclasses import dataclass
from typing import List

from ptune_sync.domain.my_task import MyTask


@dataclass
class PushCheckResult:
    to_create: List[MyTask]
    to_update: List[MyTask]
    to_delete: List[MyTask]
    errors: List[str]
    warnings: List[str]

    def can_push(self) -> bool:
        return not self.errors

    def summary(self) -> dict:
        return {
            "create": len(self.to_create),
            "update": len(self.to_update),
            "delete": len(self.to_delete),
            "errors": len(self.errors),
            "warnings": len(self.warnings),
        }

    def to_response(self) -> dict:
        return {
            "summary": self.summary(),
            "errors": self.errors,
            "warnings": self.warnings,
        }
    