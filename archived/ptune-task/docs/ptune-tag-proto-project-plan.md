# ptune-tag-proto Project Plan

## Goal

`ptune-tag-proto` is a standalone Python prototype project for validating tag generation strategies.

This project is intentionally separated from `ptune-task`.

Initial scope:

- read Obsidian Vault markdown files directly by file I/O
- use frontmatter `summary` as the primary input
- run multiple tag-generation strategies from CLI
- compare outputs and keep experiment logs

Out of scope for the first iteration:

- Obsidian plugin integration
- GUI
- direct reuse of `ptune-task` runtime/container
- production-ready deployment

## Minimal Project Structure

```text
ptune-tag-proto/
  AGENTS.md
  README.md
  pyproject.toml
  .gitignore
  src/
    ptune_tag_proto/
      __init__.py
      cli.py
      logging.py
      config.py
      models/
        note_summary.py
        tag_candidate.py
        tag_result.py
      vault/
        note_finder.py
        frontmatter_reader.py
      extract/
        summary_keyword_extractor.py
      strategies/
        base.py
        rule_only.py
      output/
        result_writer.py
  config/
    taxonomy.yml
    aliases.yml
    experiments.yml
  docs/
    overview.md
    cli.md
    input-output.md
    strategy-rule-only.md
  data/
    runs/
  tests/
```

## Directory Roles

### `src/ptune_tag_proto/cli.py`

Single Typer entrypoint.

Initial commands:

- `generate`
- `extract`
- `inspect`

Keep the first version small. One file is acceptable.

### `src/ptune_tag_proto/logging.py`

Common logger bootstrap.

Requirements:

- readable console logs
- `--log-level`
- optional file logging
- consistent tags such as `[CLI]`, `[Vault]`, `[Strategy]`

### `src/ptune_tag_proto/vault/`

Vault access layer.

Responsibilities:

- resolve vault root
- load note files by `--note` or `--glob`
- read frontmatter
- extract `summary`

This layer should not contain tag generation logic.

### `src/ptune_tag_proto/extract/`

Keyword and phrase extraction from normalized `summary`.

First iteration should prefer deterministic extraction.

### `src/ptune_tag_proto/strategies/`

Replaceable tag generation strategies.

Initial strategy set:

- `rule_only`

Later additions:

- `candidate_select`
- `llm_assist`

### `src/ptune_tag_proto/output/`

Write experiment results.

Preferred output:

- JSON for single run
- JSONL for multiple notes

Storage target:

- `data/runs/`

## Minimal CLI Design

### `generate`

Generate tags from note summaries.

Example:

```bash
python -m ptune_tag_proto.cli generate \
  --vault C:/vault \
  --note _project/example.md \
  --strategy rule-only
```

### `extract`

Inspect extracted keywords only.

Example:

```bash
python -m ptune_tag_proto.cli extract \
  --vault C:/vault \
  --note _project/example.md
```

### `inspect`

Human-readable debug output for one note.

Example:

```bash
python -m ptune_tag_proto.cli inspect \
  --vault C:/vault \
  --note _project/example.md
```

## CLI Options

Recommended initial options:

- `--vault`
- `--note`
- `--glob`
- `--strategy`
- `--config`
- `--log-level`
- `--log-file`
- `--output`

Constraints:

- either `--note` or `--glob` is required
- `--vault` is always required

## Logging Policy

The prototype should be easy to debug from terminal output.

Recommended logging style:

- `[CLI] command=generate strategy=rule-only`
- `[Vault] fileLoaded path=...`
- `[Extract] keywords=5`
- `[Strategy] selected=3 proposed=1`
- `[Output] wrote path=data/runs/...`

Minimum levels:

- `INFO`: normal progress
- `DEBUG`: extracted terms, candidate scoring, dropped items
- `ERROR`: file parse failure, invalid frontmatter, config load failure

## Docs Plan

Create these files in the new project from the beginning:

### `docs/overview.md`

- project purpose
- non-goals
- architecture summary

### `docs/cli.md`

- command list
- option list
- examples

### `docs/input-output.md`

- input contract
- output JSON schema
- sample result

### `docs/strategy-rule-only.md`

- deterministic extraction rules
- taxonomy usage
- scoring rules

## AGENTS.md Customization Plan

The new project should include a dedicated `AGENTS.md`.

Recommended content:

- this repository is a prototype for tag generation experiments
- use frontmatter `summary` as the primary input contract
- keep strategy implementations replaceable
- prefer deterministic logic before LLM-assisted logic
- store experiment outputs under `data/runs/`
- avoid Obsidian plugin concerns in this repository
- keep CLI logs readable and reproducible

Recommended additional rules:

- do not couple vault file reading with strategy logic
- do not introduce a server process in the first iteration
- do not add HTTP integration before CLI patterns are validated

## Step-by-Step Setup Plan

1. Create a new repository named `ptune-tag-proto`.
2. Add `pyproject.toml` with Typer and YAML/frontmatter dependencies.
3. Add `src/ptune_tag_proto/cli.py` as the single entrypoint.
4. Add `logging.py` and enable debug-friendly console logging.
5. Implement frontmatter `summary` loading for one note.
6. Implement `extract` command.
7. Implement `generate --strategy rule-only`.
8. Save results under `data/runs/`.
9. Add `docs/overview.md`, `docs/cli.md`, and `AGENTS.md`.
10. Open the new project in VSCode and continue implementation there.

## First Milestone

The first milestone should be limited to:

- load one note from vault
- read frontmatter `summary`
- extract simple keywords
- emit JSON result
- print readable debug logs

This is enough to validate project structure before implementing advanced strategies.
