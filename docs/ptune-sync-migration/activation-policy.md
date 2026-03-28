# PtuneSync Activation Policy

## Purpose

This document defines the activation and residency policy for PtuneSync in the
WinUI migration.

The target policy is conditional residency:

- normal URI command execution remains ephemeral
- startup retry remains caller-managed until `status.json.phase == accepted`
- browser-based OAuth may keep a temporary resident process while waiting for a
  callback
- GUI launch must still work even if a headless instance already exists

This keeps the previous "clean process per request" behavior for sync commands
while allowing the OAuth flow to remain stable across browser redirects.

## Background

Observed constraints:

- WinUI protocol activation may fail or arrive late during cold start
- callers already rely on startup retry until `accepted`
- URI-triggered sync commands historically exited after completion
- recent `run/*` handlers can leave a headless process alive without showing UI
- a leftover headless single-instance process can absorb a later Start Menu
  launch and prevent the GUI from appearing

The policy below is intended to preserve reliability first.

## Modes

PtuneSync should distinguish the following runtime modes:

- `ephemeral-runner`
  - launched by URI for one logical request
  - no UI window
  - exits after the request reaches `completed`
- `temporary-resident-auth`
  - launched by URI for browser login
  - no normal UI window required
  - remains alive only while waiting for OAuth callback completion
- `gui`
  - launched normally from Start Menu or equivalent
  - owns a visible main window
  - may stay alive after the window opens

## Command Residency Rules

The default command policy should be:

- `pull`: ephemeral
- `diff`: ephemeral
- `push`: ephemeral
- `review`: ephemeral
- `auth status`: ephemeral
- `auth login`: temporary resident
- `auth callback`: temporary resident completion path

Rationale:

- sync commands are stateless from the app-lifecycle perspective
- their reliability problem is startup acceptance, not long-lived in-memory
  state
- OAuth login is the main case that naturally spans multiple activations

## Startup Retry Contract

Caller-managed startup retry remains required.

Policy:

1. caller writes `request.json`
2. caller launches URI
3. caller waits for `status.json.phase == accepted`
4. if `accepted` is not observed within the startup timeout, caller relaunches
   the same URI with the same `request_nonce`
5. caller stops retry once `accepted`, `running`, or `completed` is observed

Implications:

- PtuneSync does not need to stay resident just to improve startup reliability
- retry logic remains centered in the caller
- residency should be decided by command semantics, not by startup instability

## GUI Launch Policy

Normal GUI launch must be treated separately from protocol command handling.

Rules:

- if no instance exists, normal launch creates the main window
- if a GUI instance already exists, normal launch should foreground that window
- if only a headless runner instance exists, normal launch should create or
  promote a GUI window in that existing instance
- a non-protocol launch must never be consumed silently by stale protocol
  activation state

This rule is required so Start Menu launch remains reliable even after previous
URI command execution.

## Exit Policy

### Ephemeral Commands

For `pull`, `diff`, `push`, `review`, and `auth status`:

- after final `status.json` write (`completed/success` or `completed/error`)
- after any required file flush
- if no GUI window is active and no other pending operation exists
- the process should exit

### Temporary Resident Auth

For `auth login`:

- the process may remain alive while waiting for OAuth callback
- once callback handling finishes and final status is written
- if no GUI window is active and no other pending operation exists
- the process should exit

### GUI Mode

If a GUI window exists:

- protocol command completion must not terminate the process
- GUI mode has priority over ephemeral runner shutdown

## Operational Guardrails

The implementation should satisfy these guardrails:

- `request_file` missing or unreadable must not be treated as a successful
  handled protocol run
- protocol dispatch failure should report to `status.json` when possible
- leftover headless instances should not block GUI launch
- residency decisions should be based on explicit mode/session state rather
  than on activation kind alone

## Recommended Implementation Direction

1. restore explicit session accounting for `run/*` handlers
2. classify each request as ephemeral or temporary-resident
3. exit automatically after completed ephemeral runs
4. keep temporary residency only for OAuth login/callback flow
5. on non-protocol activation, foreground or create a GUI window even if the
   process was previously headless
6. keep caller-side startup retry unchanged until activation reliability is
   proven in production

## Non-Goals

This policy does not define:

- a permanent always-on background service
- automatic scheduled sync
- a shared in-memory request queue across unrelated user operations

Those can be considered later only after conditional residency is stable.
