# src/ptune_sync/shared/google_id.py

import re

def is_google_id(task_id: str | None) -> bool:
    if not task_id:
        return False
    return bool(re.fullmatch(r"[A-Za-z0-9\-_]{20,}", task_id))