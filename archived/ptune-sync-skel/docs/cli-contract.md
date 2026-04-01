# Ptune Sync CLI Contract

## 1. Overview

`ptune-sync` is a CLI application responsible for synchronizing
Google Tasks with the local SQLite database.

The CLI is treated as a public contract for external clients
(e.g. VSCode extension, Obsidian integration, future WinUI3 app).

External integrations MUST rely only on:

- Standard output (stdout JSON)
- Exit codes
- Optional URI execution wrapper

Internal implementation details are NOT part of this contract.

---

## 2. Execution Format

```

uv run ptune-sync <command> [subcommand] [options]

```

---

## 3. Response Envelope

All commands MUST return the following JSON structure.

### Success

```json
{
  "version": 1,
  "timestamp": "ISO8601",
  "status": "success",
  "success": true,
  "command": "pull",
  "data": {},
  "meta": {}
}
```

### Error

```json
{
  "version": 1,
  "timestamp": "ISO8601",
  "status": "error",
  "success": false,
  "command": "pull",
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

### Rules

* `version` = CLI response version
* `timestamp` = execution time (ISO8601)
* `status` = `success` or `error`
* `success` = boolean status flag
* `command` = executed CLI command
* stdout MUST contain JSON only
* logs MUST go to stderr
* clients MUST ignore unknown fields

---

## 4. Exit Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 0    | Success                 |
| 1    | Known error             |
| 2    | Unexpected system error |

---

## 5. Error Types

| Type             | Description               |
| ---------------- | ------------------------- |
| VALIDATION_ERROR | Invalid input JSON        |
| AUTH_ERROR       | Authentication failure    |
| REMOTE_ERROR     | Google API error          |
| CONTRACT_ERROR   | CLI usage violation       |
| SYSTEM_ERROR     | Unexpected internal error |

---

## 6. URI Execution

When executed through URI:

```

ptune-sync://\<command>/\<subcommand>?param=value

```

The URI wrapper MAY write stdout JSON to a file.

Typical flow:

```

URI → CLI → stdout(JSON) → status.json

```

Clients MUST read `status.json` instead of stdout when using URI execution.

---

## 7. Stability Rules

* Removing commands is NOT allowed
* Removing options is NOT allowed
* Adding options is allowed
* Changing response structure requires version increment

