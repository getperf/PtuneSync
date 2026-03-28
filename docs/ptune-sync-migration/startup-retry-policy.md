# Ptune Sync Startup Retry Policy

## Purpose

Startup retry is intended as a safety mechanism for URI-based activation.

It is not the primary correctness mechanism.

The primary correctness mechanisms are:
- valid URI activation handling in WinUI
- request-based file contract
- `request_nonce`-based idempotency

Retry exists to reduce the impact of startup detection failures.

## Recommended Scope

Retry SHOULD be limited to startup acknowledgement.

Recommended checkpoint:
- retry only until `status.json.phase == accepted`

Retry SHOULD NOT be used after:
- `accepted`
- `running`
- `completed`

## Recommended Flow

1. caller writes `request.json`
2. caller launches URI
3. caller waits for `accepted`
4. if not accepted within the startup timeout, caller relaunches the same request
5. caller reuses the same `request_nonce`
6. after `accepted`, caller only waits for completion

## Recommended Limits

- `startup_retry_max = 3`
- `startup_wait_ms = 1000-1500`
- `poll_interval_ms = 500`
- `completion_timeout_ms = 90000`

## Required Safety Rule

Retry MUST reuse the same `request_nonce`.

This is required so the WinUI dispatcher can treat the second URI activation as
an already-known request instead of a second execution.

## Required Dispatcher Behavior

If the same `(status_file, request_nonce)` is received multiple times:
- if request is already `accepted` or `running`, do not start a second run
- if request is already `completed`, do not re-run
- if request is new, accept and start execution

If a different `request_nonce` is received while the same `status.json` still
shows `accepted` or `running`:
- do not start a second run in the same interop directory

## Non-Goals

Retry is not intended to:
- recover from command execution errors
- restart failed `push` / `pull` logic automatically
- replace proper activation lifecycle handling in WinUI

## Open Question

A later iteration should decide whether retry should be implemented entirely in
Obsidian or partly inside PtuneSync itself.
