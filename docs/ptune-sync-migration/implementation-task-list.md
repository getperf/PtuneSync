# Ptune Sync Implementation Task List

## Overview

This document translates the current migration specifications into an ordered
implementation task list.

It is intended to be used after reading:

1. `winui-uri-run-contract.md`
2. `protocol-dispatcher.md`
3. `request-status-schema.md`
4. `startup-retry-policy.md`
5. `cleanup-policy.md`

## Phase 1. Contract Finalization

### 1.1 Request / Status Contract

- Fix the final `request.json` schema
- Fix the final `status.json` schema
- Confirm required vs optional fields
- Confirm `schema_version` handling rules
- Confirm unknown-field tolerance rules
- Confirm `review` result payload goes into `status.json.data`

### 1.2 Request Identity

- Define the final `request_nonce` generation format
- Define when a new `request_nonce` is created
- Define retry reuse rules for the same `request_nonce`
- Define whether any URI-side identity other than `request_file` is needed

### 1.3 Lifecycle Rules

- Fix the final `phase` values
- Fix the final `status` values
- Confirm the accepted -> running -> completed transition rules
- Confirm which fields must be updated on every `status.json` write

### 1.4 Retry Contract

- Fix startup retry timeout values
- Fix retry count limits
- Confirm the exact stop condition for retry
- Confirm that retry is limited to startup acknowledgement only

### 1.5 Concurrency Contract

- Confirm one interop directory supports only one active request
- Confirm different `request_nonce` is rejected while prior request is active
- Confirm a different `request_nonce` is accepted after prior completion

## Phase 2. Obsidian Integration Changes

### 2.1 Work Directory Layout

- Change work directory handling to one `interop/` directory
- Remove public dependence on `runs/<request_id>/`
- Keep generated file handling under plugin-controlled paths only

### 2.2 Request File Writing

- Generate `request_nonce` per new logical operation
- Write `request.json` before URI launch
- Ensure atomic write behavior for request files
- Move command input payload references into request metadata

### 2.3 URI Builder / Client

- Update URI generation to include `request_file`
- Keep all external launches URI-based
- Ensure all commands use the same launch pattern

### 2.4 Status Watcher

- Add `accepted` phase detection
- Add startup retry before accepted
- Reuse the same `request_nonce` during retry
- Continue waiting for `completed` after accepted
- Preserve timeout handling and clear error reporting

### 2.5 Logging

- Add logs for request file creation
- Add logs for URI launch attempts
- Add logs for retry start / stop
- Add logs for accepted detection and completion detection

## Phase 3. WinUI PtuneSync Implementation

### 3.1 Protocol Activation Entry

- Receive protocol activation arguments
- Resolve `request_file`
- Pass activation input into `ProtocolDispatcher`

### 3.2 Request Reader

- Load `request.json`
- Validate required fields
- Reject invalid requests safely
- Report contract errors through `status.json` when possible

### 3.3 Protocol Dispatcher

- Check whether the request is new, a retry, or a conflicting active request
- Write `accepted` as early as possible
- Prevent duplicate execution for the same `(status_file, request_nonce)`
- Normalize URI command routing into internal command dispatch

### 3.4 Status Writer

- Implement atomic write for `status.json`
- Update `updated_at` on each write
- Write success and error envelopes consistently
- Keep `request_nonce` and `command` stable across writes

### 3.5 Command Dispatcher

- Route `auth-login`
- Route `auth-status`
- Route `pull`
- Route `diff`
- Route `push`
- Route `review`
- For `pull --include-completed`, write optional `pull-backup.json` as an
  optional artifact only

### 3.6 Idempotency

- If `accepted` or `running` already exists for the same `request_nonce`, do
  not start a second execution
- If `completed` already exists for the same `request_nonce`, do not re-run
- If a different `request_nonce` arrives while `accepted` or `running`, reject
  it in the same interop directory
- Decide whether in-memory tracking is required or if file state is sufficient

### 3.7 Cleanup

- Keep caller-visible interop files stable
- Ensure private cleanup never interrupts active runs
- Log and ignore deletion failures caused by Windows file locks

## Phase 4. Validation

### 4.1 Contract Validation

- Validate that all commands read the same request contract
- Validate that all commands write the same status contract
- Validate unknown-field tolerance on the client side

### 4.2 Retry Validation

- Verify retry occurs only before accepted
- Verify retry does not create duplicate execution
- Verify accepted stops retry
- Verify running and completed states are not retried

### 4.3 Command Validation

- Validate `auth-login` through URI activation
- Validate `auth-status`
- Validate `pull`
- Validate `diff`
- Validate `push`
- Validate `review`

### 4.4 Concurrency Validation

- Verify a new `request_nonce` is accepted after previous completion
- Verify a different `request_nonce` is rejected while prior request is active
- Verify one interop directory behaves as one active request slot

### 4.5 Migration Validation

- Compare behavior with archived `ptune-log` launcher retry behavior
- Compare behavior with current `ptune-task` URI client and watcher behavior
- Confirm that the new contract removes dependence on stdout-based data
  transfer

## Suggested First Implementation Slice

If implementation should begin with the smallest end-to-end slice, the
recommended order is:

1. Finalize `request.json` and `status.json`
2. Update Obsidian interop dir and request writing
3. Update Obsidian watcher to support `accepted`
4. Implement WinUI `ProtocolDispatcher` with idempotent accepted write
5. Implement `pull` first, including optional `pull-backup.json`
6. Validate `pull` from ptune-task through URI activation
7. Add startup retry
8. Expand to `diff`, `push`, and `review`

## Open Follow-up Items

These are intentionally left for later iterations:

- production-ready OAuth callback handling details
- whether command-specific URIs or a unified `run` URI should be chosen
- whether `events.log` should become part of the public observable contract
- whether a shared `last_status.json` view is needed for diagnostics
