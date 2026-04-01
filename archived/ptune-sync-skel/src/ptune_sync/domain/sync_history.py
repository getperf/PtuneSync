from dataclasses import dataclass
from typing import Optional


@dataclass
class SyncHistory:
    id: str
    executed_at: str
    sync_type: str

    total_tasks: int = 0
    completed_tasks: int = 0
    deleted_tasks: int = 0
    note: Optional[str] = None
