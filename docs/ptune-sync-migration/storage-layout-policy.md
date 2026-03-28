# PtuneSync Storage Layout Policy

## Purpose

This document defines the recommended storage layout for PtuneSync after the
WinUI migration, with a focus on:

- where SQLite and token state should live
- what the caller must provide
- how public interop files should be separated from private application state

The goal is to reduce coupling between the Obsidian caller and PtuneSync while
keeping backup and diagnostics practical.

## Decision Summary

Recommended default:

- store SQLite, auth tokens, config, logs, and internal run artifacts under a
  PtuneSync private root
- keep only request / status interop files in the caller-visible workspace
- treat `request_id` and run-directory naming as internal implementation
  details

This means the caller should not manage:

- internal run directories
- SQLite database files
- token files
- cleanup state

The caller should manage only the public interop contract.

## Why Not Store the DB Under the Vault by Default

Storing the DB under the Obsidian Vault has one clear advantage:

- it is easy to back up together with the Vault

However, the default design should avoid Vault-local SQLite and token storage
because it creates operational risks:

- sync tools may copy a live SQLite file while it is changing
- Vault moves, deletes, or duplicates can accidentally move internal PtuneSync
  state
- users may edit or delete internal files that are not intended to be
  user-managed
- token storage inside a broadly synced Vault is less desirable than app-local
  storage
- recovery logic becomes more complex because PtuneSync must tolerate partial
  user manipulation of internal state

These problems are manageable, but they push application-internal concerns into
the caller workspace.

## Why Private Root Is Recommended

Using a private root keeps ownership clear:

- PtuneSync owns its internal state
- the Obsidian plugin owns only the interop files it writes and watches

This improves:

- separation of responsibilities
- SQLite reliability
- OAuth token safety
- cleanup behavior
- freedom to evolve internal storage without changing the public contract

It also aligns with the existing stability rule that the local DB is not part
of the public CLI or URI contract.

## Recommended Split

Use two storage areas:

1. caller-visible interop root
2. PtuneSync private root

### Caller-Visible Interop Root

This location remains under the Vault plugin work area.

Example:

```text
<vault>/.obsidian/plugins/ptune-task/work/interop/
  request.json
  status.json
  input.json
```

This area is the public file contract.

The caller may:

- write `request.json`
- write command input files such as `input.json`
- launch the URI
- watch `status.json`

The caller should not depend on any private PtuneSync directory layout.

### PtuneSync Private Root

This location should be outside the Vault.

Windows example:

```text
%LocalAppData%/PtuneSync/
  profiles/
    <workspace-id>/
      auth/
        token.json
      config/
        settings.json
        run-cleanup.json
      db/
        ptune.db
      runtime/
        runs/
          <internal-operation-id>/
            request.snapshot.json
            status.snapshot.json
            events.log
      logs/
        app.log
```

This area is private implementation state.

PtuneSync may evolve this structure without changing the external contract, as
long as the interop contract remains stable.

## Workspace Identity

PtuneSync still needs a stable way to distinguish one caller workspace from
another.

Recommended choices:

- a normalized `vault_path`
- a caller-provided stable `workspace_id`

Preferred direction:

- pass a stable `workspace_id` in the request contract
- allow `vault_path` as auxiliary metadata when useful for diagnostics

PtuneSync can then map one workspace to one private profile directory.

## Request Identity

`request_id` should no longer be part of the public caller contract.

Recommended direction:

- the caller provides `request_file` and `status_file`, or an `interop_root`
- the caller provides `request_nonce` inside `request.json`
- PtuneSync treats `(status_file, request_nonce)` as the public request handle
- PtuneSync generates an internal operation id when it needs one for logs,
  temporary files, or diagnostics

This keeps startup retry possible without forcing the caller to manage
run-directory naming.

## Backup Strategy

Moving the DB to a private root reduces accidental coupling, but it also means
Vault backup no longer captures all PtuneSync state automatically.

That tradeoff is acceptable if backup is handled intentionally.

Recommended approach:

- keep the default storage in the private root
- add an explicit backup or export path later if users need portable snapshots
- avoid treating the live SQLite file itself as the primary backup artifact

Possible future features:

- export review history to JSON
- export a DB snapshot on demand
- import or restore from an explicit backup file

## Operational Implications

### For the Caller

The caller contract becomes simpler.

The caller should only need to know:

- how to write the request envelope
- where the public `status.json` lives
- which URI to launch

The caller should not need to know:

- where PtuneSync stores tokens
- where PtuneSync stores SQLite
- where PtuneSync keeps internal run history
- how cleanup is scheduled

### For PtuneSync

PtuneSync takes responsibility for:

- private storage initialization
- lazy DB creation
- migration handling
- token persistence
- cleanup of internal runtime artifacts
- recovery from missing or corrupted private files where practical

## Recommended Default Policy

The default implementation should be:

- `interop` files under the caller's Vault work directory
- SQLite, tokens, config, logs, and internal runs under the PtuneSync private
  root
- no public dependency on `runs/<request_id>/`
- no public dependency on private DB or token file paths

## Optional Non-Default Mode

If a future development or advanced-user mode needs Vault-local storage, it
should be treated as an explicit opt-in and documented as higher risk.

That mode would require additional safeguards such as:

- delayed DB initialization
- corruption detection
- user-facing repair guidance
- stronger warnings about file sync and manual edits

It should not be the default policy.
