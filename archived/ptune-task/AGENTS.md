# ptune-task agent guide

## Project identity

- This repository is the Obsidian implementation of `ptune-task`, not a generic sample plugin.
- Entry point is `src/main.ts`, bundled to `main.js`.
- `manifest.json` currently sets `id: "ptune-task"` and `isDesktopOnly: true`; keep both assumptions stable unless the user explicitly asks for a product-level change.
- Main user flows are:
  - daily note creation / repair
  - planned task editing and completion support
  - Google Tasks sync through the external `ptune-sync` app
  - daily review generation

## Authoritative local references

- Read these before making structural changes:
  - `docs/architecture/development-policy.md`
  - `docs/architecture/logging-policy.md`
  - `docs/architecture/ptune-task-architecture-policy.md`
- Markdown editing rules come from:
  - `docs/md-ast-core/spec-lite.md`
- External sync contract comes from:
  - `docs/ptune-sync-skel/cli-contract.md`
  - `docs/ptune-sync-skel/uri-contract.md`
  - `docs/ptune-sync-skel/task-json-schema.md`
  - `docs/ptune-sync-skel/db-model-overview.md`

## Archived code usage

- Use `archived/vscode-ptune-task/` as the primary implementation reference when intent is unclear. The current `src/` layout is derived from it.
- Use `archived/ptune-log/` as a secondary reference for older Obsidian-specific patterns such as settings, logging, i18n, and daily note workflows.
- Use `archived/ptune-sync-skel/` only to understand sync internals after checking the public contract docs first.
- Treat `archived/` as reference material, not code to copy blindly. Prefer porting concepts, naming, and tested behaviors over copying outdated platform details.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

- Run `npm run lint`, `npm test`, and `npm run build` after substantial changes when feasible.
- Tests use Jest with a mocked `obsidian` module.

## Architecture rules

- Follow the simplified clean architecture already used in `src/`:

```text
presentation -> application -> domain
                    |
             infrastructure
bootstrap composes the graph
```

- Dependency direction must stay inward. UI and Obsidian APIs stay out of domain logic.
- Keep `src/main.ts` minimal: load config, initialize i18n/logging, register commands/features, wire bootstrap.
- `src/bootstrap/` is for composition only. Keep the container/factories lean.
- `PtuneRuntime` is the main aggregation point for infrastructure access. It may hold repositories, config access, and Obsidian context.
- Do not turn every helper into a DI-managed service. Small parsers, formatters, builders, and mappers should usually be instantiated inline.
- Prefer one cohesive service with several related methods over many tiny service classes.
- Builders format output only. Repositories persist and load data only. UseCases orchestrate only.

## Markdown editing rules

- All structural Markdown edits must use `md-ast-core`.
- Required patterns:
  - `MarkdownFile.parse(...)`
  - `MarkdownFile.createEmpty()`
  - `findSection(...)` / `findSectionOrThrow(...)`
  - `append(...)`, `upsert(...)`, `resetContent(...)`, `root().ensureChild(...)`
  - `toString()`
- Do not:
  - concatenate full Markdown documents
  - insert headings manually by string manipulation
  - mutate raw Markdown outside section APIs
  - edit YAML frontmatter directly as raw text
- Root edits must use `md.root()` APIs.

## Sync contract rules

- Obsidian code must integrate with sync via the `ptune-sync` contract, not via assumptions about Python internals or SQLite schema.
- Preserve these rules:
  - URI format: `ptune-sync://...`
  - result file: `status.json` under the plugin work directory
  - stdout contract is JSON-only for CLI mode
  - clients must tolerate unknown fields in response envelopes
  - `schema_version` is part of the task JSON contract and must be preserved or migrated intentionally
- Treat database internals as non-contractual.
- Keep desktop-only assumptions around URI launching explicit; do not accidentally introduce mobile expectations into sync code.

## Logging rules

- Logging is part of the architecture, not an afterthought.
- Add logs in UseCases, important Services, Repositories, and sync integrations.
- Use standard tags from `docs/architecture/logging-policy.md`:
  - `[UseCase]`
  - `[Service]`
  - `[Repository]`
  - `[Sync]`
  - `[Command]`
- Each major UseCase should log start and end.
- Prefer identifiers, counts, flags, and statuses. Do not log full note bodies or large payloads.

## Settings, commands, and i18n

- Command IDs are stable API. Do not rename existing IDs unless the user explicitly asks for a breaking change.
- Keep settings keys backward compatible. When adding settings:
  - define defaults in `src/config/defaults.ts`
  - extend `src/config/types.ts`
  - surface them in the settings tab
- The repository already supports Japanese and English. Update both dictionaries when adding user-facing strings.
- Keep copy short and action-oriented.

## Repository-specific constraints

- Respect vault boundaries. Do not add features that read or write outside the vault unless they are part of the explicit external sync flow.
- Runtime artifacts belong under plugin-controlled paths such as `work/` and `logs/`; treat them as generated files.
- `main.js` is a generated artifact and is ignored in git during development in this repository. Do not hand-edit it.
- `README.md` still contains sample-plugin text in places. Do not treat it as authoritative architecture documentation.

## Practical review checklist

- Before adding a new class, ask:
  - can this stay in an existing service?
  - is this a real domain concept?
  - is DI actually needed?
- Before changing Markdown behavior, check whether the same outcome can be achieved through `DailyNoteDocumentAdapter` or another existing adapter.
- Before changing sync behavior, verify the change against the contract docs under `docs/ptune-sync-skel/`.
- Before changing architecture, compare with `archived/vscode-ptune-task/` to avoid reintroducing complexity that was already removed.
