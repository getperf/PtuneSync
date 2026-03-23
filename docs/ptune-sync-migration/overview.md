# Ptune Sync Migration Docs

## Overview

This directory contains migration design documents for moving PtuneSync from
`ptune-sync-skel` to a WinUI-based implementation.

These documents are shared design artifacts.

They are intentionally stored outside archived project copies so that:
- archived source trees remain read-only references
- migration specifications have a single authoritative location
- cross-project design notes can be maintained without duplicating content

## Current Document Set

- `winui-uri-run-contract.md`
  - target run contract for URI-based WinUI execution
  - covers `request_id`, `request.json`, `status.json`, run directories,
    startup retry, dispatcher idempotency, and cleanup direction
- `contract-finalization.md`
  - concrete decision draft for Phase 1 contract finalization
  - fixes the first proposal for request/status fields, request identity,
    lifecycle values, retry rules, and cleanup rules
- `protocol-dispatcher.md`
  - WinUI-side activation, idempotency, and dispatch responsibilities
- `request-status-schema.md`
  - field-level schema for `request.json` and `status.json`
- `startup-retry-policy.md`
  - focused discussion of retry scope, trigger conditions, and guardrails
- `cleanup-policy.md`
  - focused discussion of per-run directory retention and cleanup behavior
- `implementation-task-list.md`
  - ordered implementation task list derived from the migration contract docs
  - intended as the execution checklist after the contract is fixed

## Recommended Reading Order

1. `winui-uri-run-contract.md`
2. `contract-finalization.md`
3. `protocol-dispatcher.md`
4. `request-status-schema.md`
5. `startup-retry-policy.md`
6. `cleanup-policy.md`
7. `implementation-task-list.md`

## Scope

These documents currently focus on:
- URI launch for all external commands
- file-based request / status exchange
- WinUI migration safety concerns
- Obsidian-side monitoring behavior

These documents do not yet define:
- full OAuth callback flow internals
- final CLI compatibility policy
- production cleanup scheduler implementation
