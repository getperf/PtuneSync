# PtuneSync Review Command

## 1. Purpose

`review` exports one day of task activity for reflection and downstream tools.

The command reads from the local SQLite3 history database instead of querying
Google Tasks directly.

## 2. Command Shape

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

The recommended selection rule is:

1. find the latest successful `review` execution for the target `date` and
   `list`
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

If a later CLI mode needs an explicit file export, that should be treated as a
CLI-specific convenience rather than part of the URI interop contract.

## 6. Usage Notes

- The command is intended for daily retrospective workflows.
- The output may be consumed by ptune-task or Obsidian-side tooling.
- If no tasks are found for the date, the command SHOULD still return a valid
  empty task array.
- `date` is expected to align with `daily_note_key` in the local DB.
