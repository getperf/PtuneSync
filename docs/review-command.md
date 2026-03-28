# PtuneSync Review Command

## 1. Purpose

`review` exports task activity for reflection and downstream tools.

The command reads from the local SQLite3 history database instead of querying
Google Tasks directly. Google Tasks fetch and persistence are handled by
`pull`.

## 2. Command Shape

Responsibility split:

- `pull`
  - fetches Google Tasks
  - normalizes the payload
  - saves task history into SQLite
- `review`
  - queries SQLite
  - returns daily or historical review payload
  - does not require a live Google Tasks fetch in the normal path

CLI form:

```text
PtuneSync.exe review --date 2026-03-22
```

URI form:

```text
ptunesync://review?request_file=C:\workspace\interop\request.json
```

For URI execution, the caller reads the result from `status.json`.

## 3. Inputs

| Option | Description |
| ------ | ----------- |
| `--date` | Target date in `YYYY-MM-DD` |
| `--list` | Optional logical task list |

For URI execution, these values are carried in `request.json`.

## 4. Data Source

The review command uses:

- `task_histories`
- `sync_histories`
- `tasks` when supplemental latest state is needed

It MUST NOT mutate synchronization state.
It SHOULD NOT call Google Tasks directly in the normal path.

The intended operational flow is:

1. run `pull` to fetch and persist current task data
2. run `review` to query the local DB and return review payload

For historical lookup, `review` MAY run by itself without a preceding `pull`.

The recommended selection rule is:

1. find the latest successful `pull` or other persisted sync snapshot relevant
   to the target `date` and `list`
2. read its `sync_history_id`
3. export the related `task_histories`

## 5. Output Shape

For URI execution, the review payload should be embedded in
`status.json.data`.

Example:

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "review",
  "phase": "completed",
  "status": "success",
  "updated_at": "2026-03-28T09:45:12Z",
  "message": "review completed",
  "data": {
    "date": "2026-03-22",
    "list": "_Today",
    "exported_at": "ISO8601",
    "tasks": []
  },
  "error": null
}
```

The payload may later include richer sections, for example:

- `generated_sections`
- `query`
- `history_summary`

If a later CLI mode needs an explicit file export, that should be treated as a
CLI-specific convenience rather than part of the URI interop contract.

## 6. Usage Notes

- The command is intended for daily retrospective workflows.
- The output may be consumed by ptune-task or Obsidian-side tooling.
- If no tasks are found for the date, the command SHOULD still return a valid
  empty task array.
- `date` is expected to align with `daily_note_key` in the local DB.
- The command is intentionally lightweight compared with `pull`; it should be
  safe to rerun against already-persisted history.
