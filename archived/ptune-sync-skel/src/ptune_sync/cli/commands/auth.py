import typer
import logging

from ptune_sync.application.auth_usecase import AuthUseCase
from ptune_sync.config import ensure_directories
from ptune_sync.core.response import build_success, build_error, echo_json
from ptune_sync.core.exceptions import AuthError, CliError

app = typer.Typer()
logger = logging.getLogger("ptune_sync.cli.auth")


@app.command("status")
def status():
    try:
        ensure_directories()
        result = AuthUseCase.status()
        echo_json(build_success("auth.status", {"auth": result}))

    except AuthError as e:
        echo_json(build_error("AUTH_REQUIRED", str(e)))
        raise typer.Exit(code=1)

    except Exception as e:
        logger.exception("Auth status failed")
        echo_json(build_error("SYSTEM_ERROR", str(e)))
        raise typer.Exit(code=2)


@app.command("login")
def login():
    try:
        ensure_directories()
        result = AuthUseCase.login()
        echo_json(build_success("auth.login", {"auth": result}))

    except AuthError as e:
        echo_json(build_error("AUTH_REQUIRED", str(e)))
        raise typer.Exit(code=1)

    except Exception as e:
        logger.exception("Auth login failed")
        echo_json(build_error("SYSTEM_ERROR", str(e)))
        raise typer.Exit(code=2)
