# Ptune Sync Request and Status Schema

## Overview

This document defines the recommended field-level schema for the file-based run
contract used by URI-launched PtuneSync WinUI commands.

The minimum contract uses two files per run:

- `request.json`
- `status.json`

The run directory MAY also contain command-specific auxiliary files such as
`pull-backup.json`, but those files are not part of the minimum public contract.

## `request.json`

### Purpose

`request.json` is immutable caller input.

It is written before URI launch and SHOULD NOT be modified after launch.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | integer | request schema version |
| `request_id` | string | logical request key |
| `command` | string | command name |
| `created_at` | string | ISO8601 timestamp |
| `workspace.status_file` | string | output status file path |

### Recommended Optional Fields

| Field | Type | Description |
|---|---|---|
| `workspace.run_dir` | string | run directory path |
| `input.*` | object | command-specific input file paths |
| `args.*` | object | command arguments |
| `meta.*` | object | caller metadata |

### Example

```json
{
  "schema_version": 1,
  "request_id": "20260322T080000Z-a1b2c3",
  "command": "pull",
  "created_at": "2026-03-22T08:00:00Z",
  "workspace": {
    "run_dir": "work/runs/20260322T080000Z-a1b2c3",
    "status_file": "work/runs/20260322T080000Z-a1b2c3/status.json"
  },
  "args": {
    "list": "default",
    "include_completed": true
  }
}
```

## `status.json`

### Purpose

`status.json` is mutable runner output.

It is the only file the caller needs to observe after launch.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | integer | status schema version |
| `request_id` | string | logical request key |
| `command` | string | command name |
| `phase` | string | lifecycle phase |
| `status` | string | execution status |
| `timestamp` | string | ISO8601 timestamp |
| `message` | string or null | human-readable progress message |

### Recommended Optional Fields

| Field | Type | Description |
|---|---|---|
| `retry_count` | integer | observed retry count |
| `instance_id` | string | WinUI app instance identifier |
| `data` | object or null | final or intermediate result payload |
| `error` | object or null | structured error envelope |
| `meta` | object or null | diagnostics metadata |

`data` MAY contain run-local artifact paths when useful. For example, a
successful `pull` with `include_completed=true` may include:

```json
{
  "backup_file": "work/runs/20260322T080000Z-a1b2c3/pull-backup.json"
}
```

## `phase`

Recommended values:

- `created`
- `accepted`
- `running`
- `completed`

## `status`

Recommended values:

- `pending`
- `running`
- `success`
- `error`

## `error`

Recommended structure:

```json
{
  "type": "AUTH_ERROR",
  "message": "refresh token expired"
}
```

Recommended types:

- `VALIDATION_ERROR`
- `AUTH_ERROR`
- `REMOTE_ERROR`
- `CONTRACT_ERROR`
- `SYSTEM_ERROR`

## Success Example

```json
{
  "schema_version": 1,
  "request_id": "20260322T080000Z-a1b2c3",
  "command": "review",
  "phase": "completed",
  "status": "success",
  "timestamp": "2026-03-22T08:00:12Z",
  "message": "review completed",
  "retry_count": 1,
  "instance_id": "main",
  "data": {
    "generated_sections": 2
  },
  "error": null
}
```

## Error Example

```json
{
  "schema_version": 1,
  "request_id": "20260322T080000Z-a1b2c3",
  "command": "auth-login",
  "phase": "completed",
  "status": "error",
  "timestamp": "2026-03-22T08:00:12Z",
  "message": "authentication failed",
  "retry_count": 0,
  "instance_id": "main",
  "data": null,
  "error": {
    "type": "AUTH_ERROR",
    "message": "redirect callback was not received"
  }
}
```

## Compatibility Rules

Clients SHOULD:

- ignore unknown fields
- treat missing file as not-yet-written
- treat invalid JSON as temporarily unreadable and retry read
- use `request_id` as the run identity

Writers SHOULD:

- write full JSON through temp file + replace
- preserve UTF-8 encoding
- update `timestamp` on each write
