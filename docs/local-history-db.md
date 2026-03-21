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

Suggested columns:

- `task_id TEXT PRIMARY KEY`
- `list_name TEXT NOT NULL`
- `title TEXT NOT NULL`
- `status TEXT NOT NULL`
- `parent_task_id TEXT NULL`
- `started_at TEXT NULL`
- `completed_at TEXT NULL`
- `pomodoro_planned REAL NULL`
- `pomodoro_actual REAL NULL`
- `goal TEXT NULL`
- `tags_json TEXT NOT NULL`
- `review_flags_json TEXT NOT NULL`
- `source_updated_at TEXT NULL`
- `last_pulled_at TEXT NULL`
- `last_pushed_at TEXT NULL`
- `is_deleted INTEGER NOT NULL DEFAULT 0`

### `task_history`

Stores snapshots created during `pull`, `push`, and other review-relevant flows.

Suggested columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `sync_id TEXT NOT NULL`
- `task_id TEXT NOT NULL`
- `direction TEXT NOT NULL`
- `snapshot_at TEXT NOT NULL`
- `payload_json TEXT NOT NULL`
- `change_type TEXT NOT NULL`
- `list_name TEXT NOT NULL`

### `sync_history`

Stores one record per sync execution.

Suggested columns:

- `sync_id TEXT PRIMARY KEY`
- `command TEXT NOT NULL`
- `started_at TEXT NOT NULL`
- `completed_at TEXT NULL`
- `status TEXT NOT NULL`
- `task_list TEXT NULL`
- `accepted_count INTEGER NOT NULL DEFAULT 0`
- `added_count INTEGER NOT NULL DEFAULT 0`
- `updated_count INTEGER NOT NULL DEFAULT 0`
- `deleted_count INTEGER NOT NULL DEFAULT 0`
- `error_type TEXT NULL`
- `error_message TEXT NULL`

## 4. Pull Behavior

1. Fetch tasks from Google Tasks.
2. Upsert current state into `tasks`.
3. Soft delete missing tasks.
4. Record the execution in `sync_history`.
5. Save changed task snapshots into `task_history`.

## 5. Push Behavior

1. Validate input JSON.
2. Apply accepted changes to Google Tasks.
3. Update `tasks` to match accepted changes.
4. Record the execution in `sync_history`.
5. Save pushed task snapshots into `task_history`.

## 6. Review Behavior

`review` reads from the local history database and MUST NOT call Google Tasks.

The command SHOULD search `task_history` for one day of task activity and export
the result as JSON.

## 7. Stability Policy

- Public behavior is stable.
- The physical schema may evolve.
- Migrations are allowed without changing the public command contract.
