from __future__ import annotations

from pathlib import Path
from typing import Callable, Dict, Any

from ptune_sync.core.response import Response


def run_uri(
    command: str,
    func: Callable[..., Dict[str, Any]],
    status_file: Path,
    *args,
    **kwargs
):

    starting = Response(
        command=command,
        success=None,
        data={"status": "running"},
    )

    starting.write_json(status_file)

    result = func(*args, **kwargs)

    done = Response(
        command=command,
        success=True,
        data=result,
    )

    done.write_json(status_file)