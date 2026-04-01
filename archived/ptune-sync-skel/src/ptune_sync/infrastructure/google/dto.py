from dataclasses import dataclass
from typing import Optional


@dataclass
class GoogleTaskListDto:
    id: str
    title: str
    updated: Optional[str] = None
    description: Optional[str] = None


@dataclass
class GoogleTaskDto:
    id: Optional[str]
    title: str
    status: str
    notes: Optional[str] = None
    parent: Optional[str] = None
    due: Optional[str] = None
    completed: Optional[str] = None
    updated: Optional[str] = None
    deleted: bool = False
    position: Optional[str] = None
    