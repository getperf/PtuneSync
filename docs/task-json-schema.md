# PtuneSync Task JSON Schema

## 1. Scope

This schema is used by:

- `pull` output
- `diff` input
- `push` input
- `review` output

It replaces the old export/import payloads.

## 2. Root Object

```json
{
  "schema_version": 2,
  "list": "_Today",
  "exported_at": "ISO8601",
  "tasks": []
}
```

Fields:

| Field | Description |
| ----- | ----------- |
| `schema_version` | Task payload schema version |
| `list` | Logical task list name |
| `exported_at` | Export timestamp |
| `tasks` | Task array |

## 3. Task Object

```json
{
  "id": "string",
  "title": "string",
  "pomodoro_planned": 1,
  "pomodoro_actual": 2.5,
  "review_flags": [],
  "started": "ISO8601",
  "completed": "ISO8601",
  "status": "needsAction",
  "parent": null,
  "tags": [],
  "goal": "string"
}
```

Constraints:

- `status` is `needsAction` or `completed`
- `tags` is a string array
- optional fields may be `null`

## 4. Command Usage

`pull` output:

```json
{
  "schema_version": 2,
  "list": "_Today",
  "exported_at": "ISO8601",
  "tasks": []
}
```

`diff` result:

```json
{
  "added": [],
  "updated": [],
  "deleted": [],
  "warnings": []
}
```

`push` result:

```json
{
  "accepted": 10
}
```

`review` output:

```json
{
  "schema_version": 2,
  "date": "2026-03-22",
  "list": "_Today",
  "exported_at": "ISO8601",
  "tasks": []
}
```

## 5. Contract Notes

- The schema is a public contract.
- Old `export` / `import` JSON formats are retired.
- Internal database storage may evolve independently from this schema.
