# Tag Wrangler (ptune-log adapted version)

This module is based on the original **Tag Wrangler** plugin by PJ Eby (ISC License).
The codebase has been refactored to TypeScript and integrated into the ptune-log project.

## Overview

Provides tag rename, merge, and alias management for Markdown notes.
Originally designed as an independent Obsidian plugin, it is now part of
the ptune-log integrated tagging system.

## Main Components

| Class             | Responsibility                                        |
| ----------------- | ----------------------------------------------------- |
| `TagRenamer`      | Handles tag rename operations across notes            |
| `TagFileUpdater`  | Applies replacements in Markdown and YAML frontmatter |
| `TagExtractor`    | Extracts tag metadata from vault                      |
| `TagAliasUpdater` | Tracks rename history and updates alias dictionary    |

## Migration Notes

- Original plugin’s patch and command registration code were removed.
- Functionality is reimplemented in TypeScript under `src/providers/tag_wrangler`.
- YAML parsing replaced with Obsidian's native `parseYaml()` API.
- Compatible with ptune-log’s TagAliases and LLM tag modules.

## License

This code includes modifications of Tag Wrangler (PJ Eby, 2021, ISC License).
