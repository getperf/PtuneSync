# PtuneSync URI Contract

## 1. Overview

URI launch remains the primary integration path for PtuneSync.
URI handling MUST map into the same execution core used by direct CLI launch.

## 2. URI Format

```text
ptunesync://<command>?request_file=<absolute-path>
```

A unified form is also allowed:

```text
ptunesync://run?request_file=<absolute-path>
```

## 3. Examples

```text
ptunesync://launch
ptunesync://auth/status?request_file=C:\workspace\interop\request.json
ptunesync://auth/login?request_file=C:\workspace\interop\request.json
ptunesync://auth/callback?code=...&state=...
ptunesync://pull?request_file=C:\workspace\interop\request.json
ptunesync://diff?request_file=C:\workspace\interop\request.json
ptunesync://push?request_file=C:\workspace\interop\request.json
ptunesync://review?request_file=C:\workspace\interop\request.json
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

URI-triggered execution SHOULD read input from:

```text
<interop>\request.json
```

and SHOULD write the command result to:

```text
<interop>\status.json
```

Clients that use URI launch MUST read `status.json` instead of relying on
console output.

## 6. Notes

- URI launch remains supported for WinUI3 and external tool integration.
- Direct CLI execution remains supported for testing, debugging, and
  automation.
- Both entrypoints MUST produce equivalent command behavior.
- `request_id` and per-run directory naming are not part of the public URI
  contract.
