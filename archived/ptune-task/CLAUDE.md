# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npm test -- --testPathPattern="<file>"
```

Tests use Jest with a mocked `obsidian` module.

## Project

`ptune-task` is the Obsidian implementation of the ptune workflow.
It manages Daily Note task planning, Google Tasks sync, and daily review generation.

Entry point:

- `src/main.ts` -> bundled to `main.js`

Primary command surface:

- `Pull Today`
- `Push and Rebuild`
- `Generate Daily Review`
- `Login`
- `Auth Status`

## Authoritative references

Read these before making structural changes:

- `docs/architecture/development-policy.md`
- `docs/architecture/logging-policy.md`
- `docs/architecture/ptune-task-architecture-policy.md`
- `docs/md-ast-core/spec-lite.md`
- `docs/ptune-sync-skel/cli-contract.md`
- `docs/ptune-sync-skel/uri-contract.md`
- `docs/ptune-sync-skel/task-json-schema.md`

Use archived implementations as references:

- `archived/vscode-ptune-task/` is the main historical reference for the current `src/` structure
- `archived/ptune-log/` is the secondary reference for older Obsidian patterns

## Architecture

The repository follows a simplified clean architecture with minimal DI.

```text
presentation -> application -> domain
                    |
             infrastructure
bootstrap composes the graph
```

- `src/domain/` contains pure models and domain services
- `src/application/` contains use cases and orchestration logic
- `src/infrastructure/` contains Obsidian adapters, repositories, Markdown conversion, and sync adapters
- `src/presentation/` contains command entry points and editor-facing UI logic
- `src/bootstrap/` wires the app together
- `src/shared/` contains logger, i18n, and `PtuneRuntime`

Dependency flow must remain inward. Do not move Obsidian API access into domain code.

## Dependency Injection strategy

DI is intentionally minimal.

- `PtuneRuntime` is the main aggregation point for infrastructure access
- `ObsidianContext` isolates Obsidian-specific operations
- repositories and platform adapters are wired from bootstrap/factories
- small parsers, builders, mappers, and helpers should usually be instantiated inline

Avoid adding container-managed classes unless they represent real infrastructure boundaries.

## Markdown editing rules

Structural Markdown edits must use `md-ast-core`.

Required patterns:

- `MarkdownFile.parse(...)`
- `MarkdownFile.createEmpty()`
- section lookup via `findSection(...)` or `findSectionOrThrow(...)`
- section/root mutation via `append(...)`, `upsert(...)`, `resetContent(...)`, `root().ensureChild(...)`
- `toString()` for serialization

Do not:

- concatenate full Markdown documents
- insert headings manually with string operations
- mutate raw Markdown outside section APIs
- edit YAML frontmatter as raw text

Prefer existing adapters such as `DailyNoteDocumentAdapter` before introducing new Markdown manipulation paths.

## Sync integration rules

External sync uses the `ptune-sync` URI-based integration under `src/infrastructure/sync/ptune-sync-uri/`.

Current assumptions:

- desktop-only integration
- URI format starts with `ptune-sync://`
- work files live under the plugin work directory
- status is read from `status.json`
- task payloads follow the documented `schema_version` contract

Do not couple Obsidian code to Python internals or SQLite schema details.
Treat the JSON and URI contracts under `docs/ptune-sync-skel/` as the stable boundary.

## Logging

Follow `docs/architecture/logging-policy.md`.

- log in UseCases, important Services, Repositories, and sync adapters
- prefer counts, identifiers, and state flags
- avoid logging full note bodies or large payloads
- use standard tags such as `[UseCase]`, `[Service]`, `[Repository]`, `[Sync]`, `[Command]`

## Conventions

- TypeScript strict mode is expected
- keep files focused and reasonably small
- keep `src/main.ts` minimal
- command IDs are stable API
- keep settings backward compatible
- update both Japanese and English dictionaries for new user-facing strings
- register listeners with Obsidian cleanup helpers
- use `async/await` over raw promise chains

## Testing and verification

After substantial changes, run when feasible:

- `npm run lint`
- `npm test`
- `npm run build`
