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

- `task_history`
- `tasks` when supplemental latest state is needed

It MUST NOT mutate synchronization state.

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
