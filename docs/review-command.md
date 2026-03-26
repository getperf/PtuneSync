# PtuneSync Review Command

## 1. Purpose

`review` exports one day of task activity for reflection and downstream tools.

The command reads from the local SQLite3 history database instead of querying
Google Tasks directly.

## 2. Command Shape

```text
PtuneSync.exe review --date 2026-03-22 --output review.json
```

URI form:

```text
ptunesync://review?home=C:\workspace&date=2026-03-22&output=review.json
```

## 3. Inputs

| Option | Description |
| ------ | ----------- |
| `--date` | Target date in `YYYY-MM-DD` |
| `--list` | Optional logical task list |
| `--output` | Output JSON file path |

## 4. Data Source

The review command uses:

- `task_histories`
- `sync_histories`
- `tasks` when supplemental latest state is needed

It MUST NOT mutate synchronization state.

The recommended selection rule is:

1. find the latest successful `review` execution for the target `date` and `list`
2. read its `sync_history_id`
3. export the related `task_histories`

## 5. Output Shape

```json
{
  "schema_version": 2,
  "date": "2026-03-22",
  "list": "_Today",
  "exported_at": "ISO8601",
  "tasks": []
}
```

## 6. Usage Notes

- The command is intended for daily retrospective workflows.
- The output may be consumed by ptune-task or Obsidian-side tooling.
- If no tasks are found for the date, the command SHOULD still return a valid
  empty task array.
- `date` is expected to align with `daily_note_key` in the local DB.
