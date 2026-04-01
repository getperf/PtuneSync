# Task JSON Schema

## 1. Pull Output

```json
{
  "schema_version": 2,
  "list": "_Today",
  "exported_at": "ISO8601",
  "tasks": []
}
```

Fields:

| Field          | Description         |
| -------------- | ------------------- |
| schema_version | task schema version |
| list           | task list name      |
| exported_at    | export timestamp    |
| tasks          | task array          |

---

## 2. Task Object

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

* `status` = `needsAction` or `completed`
* `tags` must be string array
* optional fields may be null

---

## 3. Diff Result

```json
{
  "added": [],
  "updated": [],
  "deleted": [],
  "warnings": []
}
```

Diff operation MUST NOT modify database state.

---

## 4. Push Result

```json
{
  "accepted": 10
}
```