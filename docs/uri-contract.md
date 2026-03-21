# PtuneSync URI Contract

## 1. Overview

URI launch remains the primary integration path for PtuneSync.
URI handling MUST map into the same execution core used by direct CLI launch.

## 2. URI Format

```text
ptunesync://<command>/<subcommand>?param=value
```

Commands without subcommands may omit the subcommand segment.

## 3. Examples

```text
ptunesync://launch?home=C:\workspace
ptunesync://auth/status?home=C:\workspace
ptunesync://auth/login?home=C:\workspace
ptunesync://auth/callback?home=C:\workspace&code=...&state=...
ptunesync://pull?home=C:\workspace&list=_Today
ptunesync://diff?home=C:\workspace&input=tasks.json&list=_Today
ptunesync://push?home=C:\workspace&input=tasks.json
ptunesync://review?home=C:\workspace&date=2026-03-22&output=review.json
```

## 4. URI to Command Mapping

| URI | CommandRequest target |
| --- | --------------------- |
| `launch` | `launch` |
| `auth/status` | `auth status` |
| `auth/login` | `auth login` |
| `auth/callback` | `auth callback` |
| `pull` | `pull` |
| `diff` | `diff` |
| `push` | `push` |
| `review` | `review` |

## 5. Result Handling

URI-triggered execution SHOULD write the command result to:

```text
<home>\status.json
```

Clients that use URI launch MUST read `status.json` instead of relying on
console output.

## 6. Notes

- URI launch remains supported for WinUI3 and external tool integration.
- Direct CLI execution remains supported for testing, debugging, and automation.
- Both entrypoints MUST produce equivalent command behavior.
