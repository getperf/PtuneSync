# src/ptune_sync/cli/commands/pull.py

import typer
from ptune_sync.application.pull.pull_usecase import PullUseCase
from ptune_sync.core.constants import DEFAULT_LIST_NAME
from ptune_sync.core.response import build_success, echo_json
from ptune_sync.infrastructure.sqlite.connection import create_connection
from ptune_sync.config import get_db_path
from ptune_sync.infrastructure.sqlite.db_initializer import DatabaseInitializer
from ptune_sync.repositories.tasks_repository import TasksRepository

app = typer.Typer()


@app.command("pull")
def pull(
    list_name: str = typer.Option(DEFAULT_LIST_NAME, "--list"),
    include_completed: bool = typer.Option(
        False, "--include-completed"
    ),

):
    db_path = get_db_path()
    DatabaseInitializer(db_path).ensure()
    conn = create_connection(str(db_path))

    usecase = PullUseCase(conn)

    result = usecase.execute(
        list_name=list_name,
        include_completed=include_completed,
    )

    echo_json(build_success("pull", result))
