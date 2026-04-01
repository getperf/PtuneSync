from pathlib import Path
import sys
import typer

from ptune_sync.core.payload_reader import read_payload
from ptune_sync.core.stdin_reader import read_json_from_stdin
from ptune_sync.core.constants import DEFAULT_LIST_NAME
from ptune_sync.core.response import build_success, build_error, echo_json
from ptune_sync.application.diff.diff_usecase import DiffUseCase

app = typer.Typer()


@app.command()
def diff(
    list_name: str = typer.Option(DEFAULT_LIST_NAME, "--list"),
    input_file: Path = typer.Option(None, "--input"),
):
    payload = read_payload(input_file)

    usecase = DiffUseCase()
    result = usecase.execute(payload, list_name)

    data = result.to_response()

    if not result.can_push():
        response = build_error(
            error_type="DIFF_ERROR",
            message="Diff validation failed",
            command="diff",
            data=data,
        )
        echo_json(response)
        sys.exit(1)

    response = build_success(
        command="diff",
        data=data,
    )
    echo_json(response)
