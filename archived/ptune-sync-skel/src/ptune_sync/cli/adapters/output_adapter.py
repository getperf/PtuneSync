from __future__ import annotations

from pathlib import Path
from typing import Dict, Any

from ptune_sync.core.response import Response, echo_json


def output_cli(command: str, data: Dict[str, Any]) -> None:

    res = Response(
        command=command,
        success=True,
        data=data,
    )

    echo_json(res.to_dict())


def output_status(
    command: str,
    data: Dict[str, Any],
    status_file: Path,
) -> None:

    res = Response(
        command=command,
        success=True,
        data=data,
    )

    res.write_json(status_file)