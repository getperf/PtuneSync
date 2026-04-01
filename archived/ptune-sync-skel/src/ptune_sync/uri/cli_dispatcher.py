from __future__ import annotations

import subprocess
import sys


def run_cli(commands: list[str], options: dict):

    cli_args = [
        sys.executable,
        "-m",
        "ptune_sync.cli.main",
    ]

    cli_args.extend(commands)

    for k, v in options.items():

        if k == "home":
            continue

        cli_args.append(f"--{k.replace('_','-')}")
        cli_args.append(v)

    return subprocess.run(
        cli_args,
        capture_output=True,
        text=True,
    )