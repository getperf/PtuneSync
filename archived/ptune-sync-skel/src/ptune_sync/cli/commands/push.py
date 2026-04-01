from pathlib import Path

import typer

from ptune_sync.core.payload_reader import read_payload
from ptune_sync.core.stdin_reader import read_json_from_stdin
from ptune_sync.core.constants import DEFAULT_LIST_NAME
from ptune_sync.core.response import build_success, echo_json
from ptune_sync.application.push.push_usecase import PushUseCase

app = typer.Typer()


@app.command()
def push(
    list_name: str = typer.Option(DEFAULT_LIST_NAME, "--list"),
    allow_delete: bool = typer.Option(
        False,
        "--allow-delete",
        help="Allow deletion of remote tasks",
    ),
    input_file: Path = typer.Option(None, "--input"),
):
    payload = read_payload(input_file)

    usecase = PushUseCase()

    summary = usecase.execute(
        payload=payload,
        list_name=list_name,
        allow_delete=allow_delete,
    )

    response = build_success(
        command="push",
        data=summary,
    )

    echo_json(response)