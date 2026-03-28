# Ptune Sync Protocol Dispatcher

## Overview

This document describes the recommended responsibilities and state handling for
`ProtocolDispatcher` in the WinUI-based PtuneSync implementation.

The dispatcher is the WinUI-side entry point that receives URI activation,
loads `request.json`, and ensures that duplicate URI activations do not cause
duplicate command execution.

## Responsibilities

`ProtocolDispatcher` SHOULD be responsible for:

- receiving URI activation
- parsing `request_file`
- loading `request.json`
- validating the request envelope
- deciding whether the request is a retry, a new request, or a conflicting
  in-progress request
- updating `status.json` to `accepted`
- dispatching the internal command runner
- preventing duplicate execution for the same `(status_file, request_nonce)`

`ProtocolDispatcher` SHOULD NOT be responsible for:

- Google Tasks business logic
- token refresh implementation
- task JSON transformations
- retry scheduling on the caller side

## Recommended Flow

```text
Protocol activation
  -> parse URI
  -> resolve request.json
  -> validate request_nonce
  -> resolve status.json
  -> read existing status.json if present
  -> decide whether request is retry / new / conflicting
  -> if accepted as new: write accepted
  -> invoke internal command runner
```

## URI Input

Recommended URI forms:

```text
ptune-sync://run?request_file=<path>
```

or

```text
ptune-sync://push?request_file=<path>
ptune-sync://auth-login?request_file=<path>
```

The dispatcher SHOULD normalize both styles to the same internal command model.

## Request Validation Rules

The dispatcher SHOULD reject the request when:

- `request_file` is missing
- `request.json` cannot be read
- `request_nonce` is missing
- `command` is unsupported
- `status_file` is missing

Validation failure SHOULD result in writing an error `status.json` when
possible.

## Idempotency Rules

The dispatcher MUST treat `(status_file, request_nonce)` as the public logical
execution key.

Recommended behavior:

### Case 1. No existing `status.json`

- treat request as new
- write `accepted`
- start execution

### Case 2. Existing `status.json` has the same `request_nonce`

- if phase is `accepted` or `running`, do not start a second execution
- if phase is `completed`, do not re-run

This is the startup retry case.

### Case 3. Existing `status.json` has a different `request_nonce`

- if phase is `completed`, accept the new request and overwrite the file
- if phase is `accepted` or `running`, do not start a second execution in the
  same interop directory

This preserves one-active-request semantics for one caller-visible interop
directory.

## Recommended Status Transition

```text
caller writes request.json
  -> dispatcher writes accepted/running
  -> command runner writes running updates
  -> command runner writes completed/success or completed/error
```

The dispatcher SHOULD write the first accepted state as early as possible.

## Accepted State

Recommended minimum accepted write:

```json
{
  "schema_version": 1,
  "request_nonce": "20260328T094500123Z-01",
  "command": "push",
  "phase": "accepted",
  "status": "running",
  "updated_at": "2026-03-28T09:45:01Z",
  "message": "dispatcher accepted request",
  "retry_count": 0,
  "instance_id": "main",
  "data": null,
  "error": null
}
```

This write is the handshake that allows the caller to stop startup retry.

## Recommended Internal Components

Suggested split:

- `ProtocolDispatcher`
  - activation entry and idempotency
- `RequestReader`
  - reads and validates `request.json`
- `StatusWriter`
  - atomic write of `status.json`
- `CommandDispatcher`
  - maps command name to use case runner
- `RunRegistry`
  - optional in-memory or file-based view of active requests

A file-based implementation may work without a separate registry if
`status.json` is treated as the source of truth.

## Error Handling

If request parsing fails before `status.json` is known:
- log locally
- return without crash if possible

If `status.json` path is known:
- write `completed/error`
- include `CONTRACT_ERROR`, `BUSY`, or `SYSTEM_ERROR`

## Threading / Activation Notes

The dispatcher SHOULD accept protocol activation as early as possible in app
startup.

Redirection or activation handling SHOULD avoid blocking the UI thread longer
than necessary.

A later implementation document should define the exact WinUI activation hook.

## Non-Goals

This document does not yet define:

- exact WinUI class names
- packaged vs unpackaged app differences
- how OAuth browser redirects are resumed internally
