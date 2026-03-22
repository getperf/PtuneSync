# src/ptune_sync/cli/main.py

import typer
import logging
import sys

from ptune_sync.cli.commands.version import version_cmd
from ptune_sync.cli.commands import auth, review, pull, push, launch
from ptune_sync.cli.commands import diff as diff_cmd

from ptune_sync.core.response import build_error, echo_json
from ptune_sync.core.exceptions import (
    CliError,
    AuthError,
    DiffError,
    RemoteApiError,
    ValidationError,
)
from ptune_sync.logging_config import setup_logging

app = typer.Typer(help="Ptune Sync Skeleton CLI")
setup_logging()
logger = logging.getLogger("ptune_sync.cli")

# -----------------------------
# コマンド登録
# -----------------------------

app.command(name="version")(version_cmd)
app.add_typer(auth.app, name="auth")
app.add_typer(pull.app)
app.add_typer(push.app)
app.add_typer(review.app)
app.add_typer(diff_cmd.app)
app.add_typer(launch.app)


# -----------------------------
# 共通例外ハンドラ
# -----------------------------

def _handle_exception(e: Exception) -> int:
    """
    例外を標準JSONへ変換し exit code を返す
    """

    if isinstance(e, CliError):
        echo_json(build_error(e.error_type, e.message))
        return 1

    if isinstance(e, DiffError):
        echo_json(build_error(
            error_type="DIFF_ERROR",
            message=e.message,
            data=e.data,
            command="diff",
        ))
        return 1

    if isinstance(e, AuthError):
        echo_json(build_error("AUTH_REQUIRED", str(e)))
        return 1

    if isinstance(e, ValidationError):
        echo_json(build_error("VALIDATION_ERROR", str(e)))
        return 1

    if isinstance(e, RemoteApiError):
        echo_json(build_error("REMOTE_ERROR", str(e)))
        return 1

    # 想定外
    logger.exception("Unhandled exception")
    echo_json(build_error("SYSTEM_ERROR", str(e)))
    return 2


# -----------------------------
# エントリポイント
# -----------------------------

def main():
    try:
        app(standalone_mode=False)
    except Exception as e:
        exit_code = _handle_exception(e)
        raise SystemExit(exit_code)

if __name__ == "__main__":
    main()
