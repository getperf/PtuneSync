from dataclasses import dataclass
from typing import Optional


@dataclass
class TaskList:
    id: str
    title: str
    updated: Optional[str] = None
    description: Optional[str] = None
