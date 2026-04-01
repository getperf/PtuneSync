from typing import Callable, Dict, Any

from ptune_sync.cli.adapters.output_adapter import output_cli


def run_cli(
    command: str,
    func: Callable[..., Dict[str, Any]],
    *args,
    **kwargs
):

    result = func(*args, **kwargs)

    output_cli(command, result)