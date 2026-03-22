# src/ptune_sync/cli/commands/review.py

import json
import typer

from ptune_sync.application.review.review_usecase import ReviewUseCase
from ptune_sync.config import get_db_path
from ptune_sync.core.response import build_success, echo_json
from ptune_sync.infrastructure.sqlite.connection import create_connection
from ptune_sync.infrastructure.sqlite.db_initializer import DatabaseInitializer


app = typer.Typer()


@app.command()
def review(
    list: str = typer.Option(..., "--list"),
):
    """
    Google Tasks から全タスク取得し、
    tasks / task_histories / sync_histories を更新する。
    """

    db_path = get_db_path()
    DatabaseInitializer(db_path).ensure()
    conn = create_connection(db_path)
    usecase = ReviewUseCase(conn)

    result = usecase.execute(list)
    echo_json(build_success("review", result))

