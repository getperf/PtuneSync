# src/ptune_sync/cli/commands/version.py
from ptune_sync.version import __version__

def version_cmd():
    print(__version__)
