from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import typer

from ptune_sync.core.response import build_error, build_success
from ptune_sync.core.response import echo_json

app = typer.Typer()


@app.command()
def launch(
    home: str = typer.Option(..., help="workspace directory"),
):
    """
    URI entry command.

    Creates status.json and dispatches sub command.
    """

    home_path = Path(home)
    build_dir = home_path / "build"
    build_dir.mkdir(parents=True, exist_ok=True)
    status_file = build_dir / "status.json"

    try:

        # placeholder implementation
        response = build_success(
            command="launch",
            data={
                "home": str(home_path),
                "message": "launch success",
            },
        )

        with open(status_file, "w", encoding="utf-8") as f:
            json.dump(response, f, ensure_ascii=False)

        echo_json(response)

    except Exception as e:

        response = build_error(
            error_type="SYSTEM_ERROR",
            message=str(e),
            command="launch",
        )

        with open(status_file, "w", encoding="utf-8") as f:
            json.dump(response, f, ensure_ascii=False)

        echo_json(response)