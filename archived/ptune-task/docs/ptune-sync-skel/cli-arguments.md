# CLI Arguments Specification

## version

```

uv run ptune-sync version

```

No arguments.

---

## auth status

```

uv run ptune-sync auth status

```

---

## auth login

```

uv run ptune-sync auth login

```

---

## pull

```

uv run ptune-sync pull --list "_Today"

```

| Option | Type | Default | Description |
|------|------|--------|-------------|
| --list | string | "\_Today" | Target task list |
| --include-completed | flag | false | Include completed tasks |

---

## diff

```

uv run ptune-sync diff --input tasks.json --list "_Today"

```

| Option | Description |
|------|-------------|
| --input | Task JSON input file |
| --list | Target task list |

Required JSON schema:

```json
{
  "schema_version": 2,
  "list": "_Today",
  "tasks": []
}
```

---

## push

```

uv run ptune-sync push --input tasks.json

```

| Option  | Description          |
| ------- | -------------------- |
| --input | Task JSON input file |

Required JSON schema:

```json
{
  "schema_version": 2,
  "list": "_Today",
  "tasks": []
}
```

---

## VSCode Integration Notes

* Always check exit code
* Parse stdout only
* Never parse stderr
* Use non-shell process execution
