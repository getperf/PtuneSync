# Ptune Sync Request and Status Schema

## Overview

This document defines the recommended field-level schema for the file-based run
contract used by URI-launched PtuneSync WinUI commands.

The minimum public contract uses two fixed caller-visible files:

- `request.json`
- `status.json`

The public contract does not require per-request run directories.

PtuneSync MAY still create private internal artifacts such as runtime logs or
request snapshots outside the caller-visible interop directory.

## `request.json`

### Purpose

`request.json` is immutable caller input.

It is written before URI launch and SHOULD NOT be modified after launch, except
when the caller intentionally prepares the next logical request after the
previous one completes.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | integer | request schema version |
| `request_nonce` | string | public logical request key |
| `command` | string | command name |
| `created_at` | string | ISO8601 timestamp |
| `status_file` | string | output status file path |

### Recommended Optional Fields

| Field | Type | Description |
|---|---|---|
| `input_file` | string | command-specific input file path |
| `workspace_id` | string | caller workspace identity |
| `args.*` | object | command arguments |
| `meta.*` | object | caller metadata |

### Example

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "pull",
  "created_at": "2026-03-28T09:45:00Z",
  "status_file": "work/interop/status.json",
  "args": {
    "list": "default",
    "include_completed": true
  }
}
```

## `status.json`

### Purpose

`status.json` is mutable runner output.

It is the only public output file the caller needs to observe after launch.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `schema_version` | integer | status schema version |
| `request_nonce` | string | public logical request key |
| `command` | string | command name |
| `phase` | string | lifecycle phase |
| `status` | string | execution status |
| `updated_at` | string | ISO8601 timestamp |
| `message` | string or null | human-readable progress message |

### Recommended Optional Fields

| Field | Type | Description |
|---|---|---|
| `retry_count` | integer | observed retry count |
| `instance_id` | string | WinUI app instance identifier |
| `data` | object or null | final or intermediate result payload |
| `error` | object or null | structured error envelope |
| `meta` | object or null | diagnostics metadata |

`data` MAY contain command results directly.

Examples:

- `pull` summary counts
- `review` exported review payload
- optional artifact references such as `pull-backup.json`

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
- `BUSY`
- `SYSTEM_ERROR`

## Success Example

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "review",
  "phase": "completed",
  "status": "success",
  "updated_at": "2026-03-28T09:45:12Z",
  "message": "review completed",
  "retry_count": 1,
  "instance_id": "main",
  "data": {
    "date": "2026-03-28",
    "list": "_Today",
    "tasks": []
  },
  "error": null
}
```

## Error Example

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "auth-login",
  "phase": "completed",
  "status": "error",
  "updated_at": "2026-03-28T09:45:12Z",
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
- use `request_nonce` to distinguish retry from a new request

Writers SHOULD:

- write full JSON through temp file + replace
- preserve UTF-8 encoding
- update `updated_at` on each write
