# PtuneSync CLI Contract

## 1. Overview

`PtuneSync` exposes both a CLI entrypoint and a URI entrypoint.

Both entrypoints MUST delegate to the same internal execution core.
The public contract applies to:

- direct CLI execution
- URI-triggered execution
- future editor or tool integrations

The database schema and UI behavior are NOT part of this public contract.

## 2. Execution Model

The application supports two entry styles:

```text
PtuneSync.exe <command> [subcommand] [options]
ptunesync://<command>/<subcommand>?param=value
```

Both MUST be converted into a shared internal `CommandRequest`.

## 3. Supported Commands

- `launch`
- `auth status`
- `auth login`
- `auth callback`
- `pull`
- `diff`
- `push`
- `review`

Removed commands:

- `export`
- `import`

## 4. Response Envelope

Successful execution:

```json
{
  "version": 1,
  "timestamp": "ISO8601",
  "status": "success",
  "success": true,
  "command": "pull",
  "data": {},
  "meta": {}
}
```

Error execution:

```json
{
  "version": 1,
  "timestamp": "ISO8601",
  "status": "error",
  "success": false,
  "command": "pull",
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

Rules:

- `version` is the response contract version.
- `timestamp` uses ISO8601 UTC.
- `stdout` MUST contain JSON only for direct CLI execution.
- logs MUST go to `stderr`.
- clients MUST ignore unknown fields.

## 5. Exit Codes

| Code | Meaning |
| ---- | ------- |
| 0 | Success |
| 1 | Known error |
| 2 | Unexpected system error |

## 6. Error Types

| Type | Description |
| ---- | ----------- |
| `VALIDATION_ERROR` | Invalid input or missing required options |
| `AUTH_ERROR` | Authentication or token failure |
| `REMOTE_ERROR` | Google Tasks API failure |
| `CONTRACT_ERROR` | Invalid command or unsupported contract usage |
| `SYSTEM_ERROR` | Unexpected internal error |

## 7. Stability Rules

- Removing commands is not allowed after contract publication.
- Removing options is not allowed after contract publication.
- Adding options is allowed.
- Changing the response envelope requires a version increment.
- Internal service or database changes do not require a contract change.
