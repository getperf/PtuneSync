from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from ptune_sync.core.response import Response, build_error
from ptune_sync.logging_config import setup_logging
from ptune_sync.uri.uri_parser import parse_uri
from ptune_sync.uri.cli_dispatcher import run_cli

setup_logging()
logger = logging.getLogger("ptune_sync.cli")

def main() -> int:

    if len(sys.argv) < 2:
        logger.debug("missing uri argument")
        print("missing uri", file=sys.stderr)
        return 1

    raw_uri = sys.argv[1]
    logger.debug("uri_entry raw_uri=%s", raw_uri)

    commands, query = parse_uri(raw_uri)
    logger.debug("uri_entry commands=%s query=%s", commands, query)

    home = Path(query.get("home", ""))
    logger.debug("uri_entry home=%s", home)

    status_file = home / "status.json"
    log_file = home / "events.log"
    logger.debug("uri_entry status_file=%s log_file=%s", status_file, log_file)

    status_file.parent.mkdir(parents=True, exist_ok=True)

    Response(
        command=" ".join(commands),
        status="running",
        success=None,
        data={"phase": "launching"},
    ).write_json(status_file)
    logger.debug("uri_entry wrote running status")

    try:
        result = run_cli(commands, query)
        logger.debug(
            "uri_entry returncode=%s stdout_len=%s stderr_len=%s",
            result.returncode,
            len(result.stdout or ""),
            len(result.stderr or ""),
        )

        if result.stdout and result.stdout.strip():
            try:
                parsed = json.loads(result.stdout)
                status_file.write_text(
                    json.dumps(parsed, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                logger.debug("uri_entry wrote stdout json to status_file")
            except Exception:
                logger.exception("uri_entry failed to parse stdout json")
                error_payload = build_error(
                    error_type="SYSTEM_ERROR",
                    message="stdout was not valid JSON",
                    command=" ".join(commands),
                    data={"returncode": result.returncode},
                )
                status_file.write_text(
                    json.dumps(error_payload, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
        else:
            error_payload = build_error(
                error_type="SYSTEM_ERROR" if result.returncode == 2 else "COMMAND_ERROR",
                message=(result.stderr or "ptune-sync returned no stdout").strip(),
                command=" ".join(commands),
                data={"returncode": result.returncode},
            )
            status_file.write_text(
                json.dumps(error_payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            logger.debug("uri_entry wrote synthesized error json to status_file")
    except Exception as e:
        logger.exception("uri_entry failed")
        error_payload = build_error(
            error_type="SYSTEM_ERROR",
            message=str(e),
            command=" ".join(commands),
        )
        status_file.write_text(
            json.dumps(error_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        result = None

    with open(log_file, "a", encoding="utf-8") as f:
        f.write("\n--- uri call ---\n")
        f.write(raw_uri + "\n")
        f.write(f"commands={commands}\n")
        f.write(f"query={query}\n")
        f.write(f"home={home}\n")
        f.write(f"status_file={status_file}\n")

        if result and result.stdout:
            f.write("\nstdout:\n")
            f.write(result.stdout)

        if result and result.stderr:
            f.write("\nstderr:\n")
            f.write(result.stderr)

    if result is None:
        return 2

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
