# PtuneSync agent guide

## Project purpose

PtuneSync is a WinUI3 application for synchronizing Google Tasks with
local task data used by the ptune ecosystem.

Current migration target:
- adopt the pull/diff/push contract validated in `ptune-sync-skel`
- keep URI launch and `status.json` based result handling
- keep a CLI entrypoint for testing and automation
- extend the existing PtuneSync auth flow for browser-based Google OAuth

## Rules

- Treat `CLI` and `URI` as public entrypoints, but keep execution logic unified.
- Keep public contracts under `docs/` stable and explicit.
- Do not reintroduce the old `export` / `import` contract.
- Do not migrate the bundled-secret PKCE design from `ptune-sync-skel`.
- Prefer the Windows default browser based OAuth flow with redirect URI handling.
- Keep SQLite usage behind services and repositories.
- Treat `status.json` as the formal result channel for URI-triggered execution.
- Keep logs readable and separate from machine-readable JSON output.

## Initial focus

- `pull`
- `diff`
- `push`
- `review`
- `auth status`
- `auth login`
- `auth callback`

## Migration notes

- `export`
- `import`
- GUI quick task entry

These are considered removed features and should not be reintroduced while
porting `ptune-sync-skel` ideas into PtuneSync.
