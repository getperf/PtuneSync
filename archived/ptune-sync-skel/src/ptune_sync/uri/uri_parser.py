from __future__ import annotations

from urllib.parse import urlparse, parse_qs, unquote


def parse_uri(raw_uri: str):

    parsed = urlparse(raw_uri)

    command = parsed.netloc

    sub = parsed.path.lstrip("/")

    commands = [command]

    if sub:
        commands.append(sub)

    query = {k: unquote(v[0]) for k, v in parse_qs(parsed.query).items()}

    return commands, query