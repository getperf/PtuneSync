import sys
import json
from typing import Dict, Any
from ptune_sync.core.exceptions import ValidationError


def read_json_from_stdin() -> Dict[str, Any]:

    if sys.stdin.isatty():
        raise ValidationError("stdin required (pipe JSON input)")

    try:
        raw_bytes = sys.stdin.buffer.read()

        if not raw_bytes.strip():
            raise ValidationError("stdin is empty")

        raw = raw_bytes.decode("utf-8")

        return json.loads(raw)

    except UnicodeDecodeError:
        raise ValidationError("stdin must be UTF-8 encoded JSON")

    except json.JSONDecodeError as e:
        raise ValidationError(f"invalid json: {e.msg}") from e