# Ptune Sync Contract Finalization Draft

## Purpose

This document fixes the first concrete proposal for Phase 1 `Contract Finalization`
in `implementation-task-list.md`.

The goal is to reduce ambiguity before implementation starts in either the
Obsidian client or the WinUI PtuneSync side.

## 1. Request / Status Contract

### 1.1 File Set

Use one run directory per request:

- `work/runs/<request_id>/request.json`
- `work/runs/<request_id>/status.json`

Do not introduce additional required public JSON files at this stage.

Command-local artifacts are allowed when explicitly documented. The first such
artifact is:

- `work/runs/<request_id>/pull-backup.json` for successful `pull --include-completed`

### 1.2 request.json

Required fields:

- `schema_version`
- `request_id`
- `command`
- `created_at`
- `status_file`

Optional fields:

- `input_file`
- `options`
- `meta`

Recommended shape:

```json
{
  "schema_version": 1,
  "request_id": "20260323T021530123Z-a1b2c3d4",
  "command": "push",
  "created_at": "2026-03-23T02:15:30.123Z",
  "status_file": ".../work/runs/20260323T021530123Z-a1b2c3d4/status.json",
  "input_file": ".../work/runs/20260323T021530123Z-a1b2c3d4/input.json",
  "options": {
    "list": "default",
    "allow_delete": false
  },
  "meta": {
    "source": "obsidian-plugin"
  }
}
```

### 1.3 status.json

Required fields:

- `schema_version`
- `request_id`
- `command`
- `phase`
- `status`
- `updated_at`

Optional fields:

- `message`
- `error`
- `data`
- `instance_id`
- `retry_count`

`data.backup_file` is allowed when a command produces a run-local artifact.

Recommended shape:

```json
{
  "schema_version": 1,
  "request_id": "20260323T021530123Z-a1b2c3d4",
  "command": "push",
  "phase": "running",
  "status": "running",
  "updated_at": "2026-03-23T02:15:32.441Z",
  "message": "push started",
  "retry_count": 0
}
```

Final success example:

```json
{
  "schema_version": 1,
  "request_id": "20260323T021530123Z-a1b2c3d4",
  "command": "push",
  "phase": "completed",
  "status": "success",
  "updated_at": "2026-03-23T02:15:40.017Z",
  "message": "push completed",
  "data": {
    "accepted": 12
  }
}
```

Final error example:

```json
{
  "schema_version": 1,
  "request_id": "20260323T021530123Z-a1b2c3d4",
  "command": "push",
  "phase": "completed",
  "status": "error",
  "updated_at": "2026-03-23T02:15:34.101Z",
  "message": "push failed",
  "error": {
    "code": "request_invalid",
    "message": "input_file was not found"
  }
}
```

### 1.4 Compatibility Rules

- Clients must ignore unknown fields.
- Missing required fields make the payload invalid.
- While a JSON file is being written, parse failure should be treated as a temporary unreadable state and retried.
- Atomic write is required for both `request.json` and `status.json`.

## 2. Request Identity

### 2.1 request_id Format

Recommended format:

- `YYYYMMDDTHHMMSSmmmZ-<8hex>`

Example:

- `20260323T021530123Z-a1b2c3d4`

This format is:

- sortable by time
- readable in logs
- unique enough for retry and cleanup use

### 2.2 When to Create a New request_id

Create a new `request_id` for each logical operation:

- one `auth-login`
- one `auth-status`
- one `pull`
- one `diff`
- one `push`
- one `review`

### 2.3 Retry Reuse Rule

If startup retry occurs before the request is accepted:

- reuse the same `request_id`
- reuse the same run directory
- do not create a second request directory

### 2.4 URI Validation

`request_id` should be included in the URI query when practical, but the
canonical source of truth remains `request.json`.

## 3. Lifecycle Rules

### 3.1 phase Values

Fix the final `phase` set to:

- `created`
- `accepted`
- `running`
- `completed`

### 3.2 status Values

Fix the final `status` set to:

- `pending`
- `running`
- `success`
- `error`

### 3.3 Valid Combinations

Recommended combinations:

- `created` + `pending`
- `accepted` + `running`
- `running` + `running`
- `completed` + `success`
- `completed` + `error`

### 3.4 Transition Rules

Recommended transition order:

1. Obsidian writes `request.json`
2. Obsidian may write initial `status.json` as `created/pending`
3. URI launch occurs
4. WinUI dispatcher writes `accepted/running`
5. Command execution writes `running/running`
6. Final state becomes `completed/success` or `completed/error`

### 3.5 Fields Updated on Every status.json Write

Always update:

- `phase`
- `status`
- `updated_at`
- `message` when available

Always keep stable:

- `schema_version`
- `request_id`
- `command`

## 4. Retry Contract

### 4.1 Scope

Retry is a startup safety mechanism only.

Retry is allowed only until `accepted` is observed.

### 4.2 Retry Trigger

Retry may happen if:

- `status.json` does not exist yet
- `status.json` exists but remains at `created/pending`
- `accepted` is not observed within the startup timeout

### 4.3 Retry Stop Condition

Stop retry immediately when:

- `phase == accepted`
- `phase == running`
- `phase == completed`

### 4.4 Retry Limits

Recommended defaults:

- startup wait per attempt: `1000-1500 ms`
- poll interval: `500 ms`
- max startup retries: `2-3`
- full command timeout: `90000 ms`

### 4.5 Duplicate Execution Rule

The WinUI side must treat `request_id` as idempotent.

If the same request is retried:

- do not start a second execution if already `accepted` or `running`
- do not restart if already `completed`

## 5. Cleanup Contract

### 5.1 Directory Layout

Use:

- `work/runs/<request_id>/`

### 5.2 Deletion Eligibility

Only completed runs are eligible for cleanup.

Do not remove runs that are still:

- `created`
- `accepted`
- `running`

### 5.3 Cleanup Timing

Recommended timing:

- on app startup
- when creating a new request
- optional periodic cleanup later

Do not delete immediately after completion.

### 5.4 Failure Handling

If Windows file locking prevents deletion:

- log a warning
- leave the run directory in place
- retry cleanup later

Cleanup must be best-effort.

### 5.5 Retention Policy

Recommended initial policy:

- keep recent completed runs for a limited window
- example: keep 7 days or the latest 50 runs

Exact retention numbers may remain configurable later.

## 6. Proposed Freeze for Phase 1

The following should be treated as frozen unless a later contract review changes them intentionally:

- all external commands stay URI-based
- all observable command state stays file-based
- one run directory per `request_id`
- public files are limited to `request.json` and `status.json`
- command-local artifacts such as `pull-backup.json` are optional and non-required
- startup retry is allowed only before `accepted`
- dispatcher idempotency is based on `request_id`
- cleanup is delayed and best-effort

## 7. Recommended Next Step

After this contract is accepted, implementation should proceed in this order:

1. request/status schema implementation
2. Obsidian request file writing and watcher update
3. WinUI dispatcher accepted write and idempotency
4. startup retry validation
5. command-by-command rollout
