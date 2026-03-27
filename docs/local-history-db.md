# PtuneSync Local History Database

## 1. Purpose

PtuneSync uses a local SQLite3 database to support:

- current task state storage
- synchronization history
- daily review export
- change detection and diagnostics

The database schema is NOT part of the public CLI or URI contract.

## 2. Database Engine

- SQLite3

## 3. Core Tables

### `tasks`

Stores the latest normalized task state.

Columns:

- `id TEXT PRIMARY KEY`
- `list_name TEXT NOT NULL`
- `title TEXT NOT NULL`
- `status TEXT NOT NULL`
- `parent TEXT NULL`
- `started TEXT NULL`
- `completed TEXT NULL`
- `pomodoro_planned INTEGER NULL`
- `pomodoro_actual REAL NULL`
- `review_flags_json TEXT NULL`
- `goal TEXT NULL`
- `tags_json TEXT NULL`
- `google_updated_at TEXT NULL`
- `last_pulled_at TEXT NULL`
- `last_pushed_at TEXT NULL`
- `deleted_at TEXT NULL`

Notes:

- `tasks` is the current-state cache.
- `pull` and `push` both update this table.
- `diff` reads from this table and SHOULD NOT mutate it.
- `deleted_at IS NULL` means the task is currently active.

### `sync_histories`

Stores one record per command execution.

Columns:

- `id TEXT PRIMARY KEY`
- `command TEXT NOT NULL`
- `status TEXT NOT NULL`
- `list_name TEXT NOT NULL`
- `daily_note_key TEXT NULL`
- `started_at TEXT NOT NULL`
- `completed_at TEXT NULL`
- `accepted_count INTEGER NOT NULL DEFAULT 0`
- `added_count INTEGER NOT NULL DEFAULT 0`
- `updated_count INTEGER NOT NULL DEFAULT 0`
- `deleted_count INTEGER NOT NULL DEFAULT 0`
- `note TEXT NULL`

Notes:

- `command` values are expected to include `pull`, `diff`, `push`, and `review`.
- `status` is expected to include `running`, `success`, and `error`.
- `daily_note_key` uses `YYYY-MM-DD`.
- `error` details are intentionally kept out of the DB and should remain in logs and `status.json`.

### `task_histories`

Stores task snapshots for commands that intentionally create historical records.

Columns:

- `history_id TEXT PRIMARY KEY`
- `task_id TEXT NOT NULL`
- `list_name TEXT NOT NULL`
- `daily_note_key TEXT NULL`
- `title TEXT NOT NULL`
- `status TEXT NOT NULL`
- `parent TEXT NULL`
- `started TEXT NULL`
- `completed TEXT NULL`
- `pomodoro_planned INTEGER NULL`
- `pomodoro_actual REAL NULL`
- `review_flags_json TEXT NULL`
- `goal TEXT NULL`
- `tags_json TEXT NULL`
- `snapshot_at TEXT NOT NULL`
- `snapshot_type TEXT NOT NULL`
- `sync_history_id TEXT NOT NULL`
- `deleted_at TEXT NULL`
- `google_updated_at TEXT NULL`

Notes:

- `task_histories` is written by `push` and `review`.
- `pull` does NOT write `task_histories`.
- `diff` does NOT write `task_histories`.
- `daily_note_key` is primarily for `review` so the latest successful review for a day is easy to identify.

## 4. Pull Behavior

1. Fetch tasks from Google Tasks.
2. Upsert current state into `tasks`.
3. Soft delete missing tasks.
4. Record the execution in `sync_histories`.
5. Do not write `task_histories`.
6. If `include_completed=true`, PtuneSync MAY write a run-local JSON backup file such as `pull-backup.json`.

The backup file is a short-lived run artifact and is not part of the SQLite history model.

## 5. Push Behavior

1. Validate input JSON.
2. Apply accepted changes to Google Tasks.
3. Update `tasks` to match accepted changes.
4. Record the execution in `sync_histories`.
5. Save pushed task snapshots into `task_histories`.

Notes:

- completed tasks may be treated as reorder-restricted during push
- callers should not assume that push rewrites completed-task ordering to exactly match the submitted payload

## 6. Review Behavior

`review` reads from the local history database and MUST NOT call Google Tasks.

The command SHOULD search `task_histories` for one day of task activity and export
the result as JSON.

The command SHOULD identify the latest successful review for a given
`daily_note_key` and `list_name` through `sync_histories`.

## 7. Stability Policy

- Public behavior is stable.
- The physical schema may evolve.
- Migrations are allowed without changing the public command contract.
