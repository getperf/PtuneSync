from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

CLI_RESPONSE_VERSION = 1


def _timestamp() -> str:
    return datetime.now().astimezone().isoformat(timespec="milliseconds")


@dataclass
class Response:

    version: int = CLI_RESPONSE_VERSION
    timestamp: str = field(default_factory=_timestamp)

    status: str = "success"     # running | success | error
    success: Optional[bool] = None

    command: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
    data: Dict[str, Any] = field(default_factory=dict)
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:

        result: Dict[str, Any] = {
            "version": self.version,
            "timestamp": self.timestamp,
            "status": self.status,
        }

        if self.success is not None:
            result["success"] = self.success

        if self.command:
            result["command"] = self.command

        if self.error:
            result["error"] = self.error

        if self.data:
            result["data"] = self.data

        if self.meta:
            result["meta"] = self.meta

        return result

    def write_json(self, path: Path) -> None:

        tmp = path.with_suffix(".tmp")

        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())

        os.replace(tmp, path)

def build_success(
    command: str,
    data: Dict[str, Any],
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    response = Response(
        status="success",
        success=True,
        command=command,
        data=data,
        meta=meta or {},
    )

    return response.to_dict()


def build_error(
    error_type: str,
    message: str,
    command: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    response = Response(
        status="error",
        success=False,
        command=command,
        data=data or {},
        meta=meta or {},
        error={
            "type": error_type,
            "message": message,
        },
    )

    return response.to_dict()

def echo_json(data: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(data, ensure_ascii=False))
    sys.stdout.write("\n")
    sys.stdout.flush()

