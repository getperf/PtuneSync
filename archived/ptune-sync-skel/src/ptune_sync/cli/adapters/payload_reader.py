from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional


def read_payload(input_file: Optional[Path]) -> Dict[str, Any]:

    if input_file:
        with open(input_file, "r", encoding="utf-8") as f:
            return json.load(f)

    data = sys.stdin.read()

    if not data.strip():
        raise RuntimeError("payload JSON required")

    return json.loads(data)