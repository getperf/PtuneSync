# Migration From ptune-sync-skel

## 1. Purpose

This document records which ideas from `ptune-sync-skel` are adopted in
PtuneSync and which are intentionally not migrated.

## 2. Adopted

- `pull`, `diff`, `push` as the main sync commands
- task JSON schema version 2
- stdout JSON contract for CLI execution
- URI launch with `status.json` result handling
- local SQLite3 history database
- history-backed `review` export command

## 3. Changed

- PtuneSync keeps both CLI and URI entrypoints, but both map into one shared
  execution core.
- OAuth is implemented through PtuneSync browser-based login and callback
  handling.
- Redirect URI handling is documented as part of the PtuneSync auth contract.

## 4. Rejected

- old `export` command
- old `import` command
- GUI quick task entry workflow
- bundled-secret PKCE authentication design

## 5. Implementation Direction

Recommended internal structure:

- protocol parsing layer
- shared command execution core
- auth services
- sync services
- review export service
- status file service
- SQLite3 repositories

This separation keeps URI and CLI behavior aligned while allowing the WinUI3
application to remain the host application.
