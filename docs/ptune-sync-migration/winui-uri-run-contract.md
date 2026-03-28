# Ptune Sync WinUI URI Run Contract

## 1. Overview

This document defines the target run contract for migrating `PtuneSync` to a
WinUI-based implementation while preserving URI-based integration from
Obsidian.

The current target contract is:

- caller-visible exchange through `request.json` and `status.json`
- one caller-visible interop directory
- `request_nonce` as the public logical request key
- no public dependency on `runs/<request_id>/`
- startup retry only until `accepted`

## 2. Design Goals

The contract is designed to satisfy the following constraints:

- Obsidian continues to launch PtuneSync through URI for all commands
- request / response data is exchanged through files, not stdout
- OAuth login remains compatible with redirect-URI based authentication
- retry can be added safely as a startup watchdog
- duplicate execution caused by retry must be prevented
- partial JSON reads / writes must be avoided through atomic file replacement

## 3. Recommended Execution Model

External launch method:

- all commands use URI activation

Internal data exchange:

- all commands use file-based request / status exchange

Recommended flow:

```text
Obsidian
  -> write request.json
  -> launch ptune-sync://run?...request_file=...
  -> watch status.json
  -> optional startup retry until accepted
  -> wait for completed
```

Recommended command coverage:

- `auth-login`
- `auth-status`
- `pull`
- `diff`
- `push`
- `review`

## 4. Caller-Visible Interop Layout

Use one caller-visible interop directory:

```text
work/
  interop/
    request.json
    status.json
    input.json
```

Optional auxiliary files MAY be added later, but they are not part of the
minimum public contract.

## 5. Public Request Identity

Each logical request MUST have a `request_nonce`.

Rules:

- one logical request = one `request_nonce`
- retry MUST reuse the same `request_nonce`
- a new user operation MUST create a new `request_nonce`

`request_id` may still be used internally by PtuneSync, but it is not part of
the public caller contract.

## 6. request.json

`request.json` is immutable input.

It MUST be fully written before URI launch.

Recommended structure:

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "push",
  "created_at": "2026-03-28T09:45:00Z",
  "status_file": "work/interop/status.json",
  "input_file": "work/interop/input.json",
  "args": {
    "list": "_Today",
    "allow_delete": false
  }
}
```

Required fields:

- `schema_version`
- `request_nonce`
- `command`
- `created_at`
- `status_file`

Clients MUST tolerate unknown fields.

## 7. status.json

`status.json` is mutable output written by PtuneSync.

It is used for:

- startup acknowledgement
- running state
- final success / error result

Recommended structure:

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "push",
  "phase": "running",
  "status": "running",
  "updated_at": "2026-03-28T09:45:02Z",
  "message": "push started",
  "retry_count": 0,
  "instance_id": "main",
  "data": null,
  "error": null
}
```

Final success example:

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
    "date": "2026-03-28",
    "list": "_Today",
    "tasks": []
  },
  "error": null
}
```

## 8. Phase and Status

Recommended `phase` values:

- `created`
- `accepted`
- `running`
- `completed`

Recommended `status` values:

- `pending`
- `running`
- `success`
- `error`

## 9. URI Format

All commands SHOULD continue to use URI activation.

Recommended format:

```text
ptune-sync://run?request_file=<absolute-or-encoded-path>
```

Alternative command-specific format is also acceptable:

```text
ptune-sync://push?request_file=...
ptune-sync://auth-login?request_file=...
```

## 10. Startup Retry Policy

Startup retry is recommended as a safety mechanism.

It SHOULD be used only until the request is accepted.

Recommended policy:

1. caller writes `request.json`
2. caller launches URI
3. caller waits for `status.json.phase == accepted`
4. if not accepted within the startup timeout, relaunch URI with the same
   `request_nonce`
5. stop retry when accepted is observed
6. after accepted, only wait for `completed`

## 11. Dispatcher Idempotency

The WinUI dispatcher MUST be idempotent for retry.

Recommended behavior:

- if the same `(status_file, request_nonce)` is seen again and status is
  already `accepted` or `running`
  - do not start a second execution
- if the same `(status_file, request_nonce)` is seen again and status is
  already `completed`
  - do not re-run
- if a different `request_nonce` is seen while the same `status.json` is still
  `accepted` or `running`
  - do not start a second execution in the same interop directory
- if a different `request_nonce` is seen after the previous one is
  `completed`
  - accept it as a new request

## 12. Atomic Write Rules

For both `request.json` and `status.json`:

- write to a temporary file first
- flush and close file handle
- replace target file atomically

Clients MUST assume:

- partially written JSON is invalid
- missing file means "not yet written"
- parse error means "treat as not readable yet" and retry read

## 13. Recommended Migration Direction

For PtuneSync WinUI migration, the recommended direction is:

- keep URI launch for all commands
- switch all payload exchange to file-based contract
- use one caller-visible interop directory
- use `request_nonce` as the public logical request key
- introduce `accepted` phase
- add limited startup retry
- make dispatcher idempotent for retry

## 14. Open Items

The following remain for a later iteration:

- exact WinUI `ProtocolDispatcher` implementation details
- whether separate interop directories are needed for future parallel runs
- whether `events.log` should be part of the public contract
- whether command-specific URI paths are preferable to a unified `run` path
