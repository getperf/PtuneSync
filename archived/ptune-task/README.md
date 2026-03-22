# ptune-task

## Overview

**ptune-task** is an Obsidian plugin for the ptune workflow.
It helps manage daily planning, task sync, and end-of-day review around Obsidian Daily Notes.

Google Tasks integration is handled through the external `ptune-sync` application.

## Features

- Pull today's tasks into the Daily Note planned-task section
- Push edited tasks back through `ptune-sync`
- Rebuild Daily Note task sections after sync
- Generate a daily review from task data
- Support task-focused editing inside Daily Notes

## Compatibility

- Obsidian Desktop only
- `manifest.json` currently sets `isDesktopOnly: true`

## Commands

- `Pull Today`
- `Push and Rebuild`
- `Generate Daily Review`
- `Login`
- `Auth Status`

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

Manual install target:

```text
<Vault>/.obsidian/plugins/ptune-task/
```

Release artifacts:

- `main.js`
- `manifest.json`
- `styles.css`

## Documentation

Official documentation:

- Japanese: https://ptune.getperf.net/
- English: https://ptune.getperf.net/en/

Architecture and local development references in this repository:

- `docs/architecture/`
- `docs/md-ast-core/`
- `docs/ptune-sync-skel/`

## License

MIT

## Issues

Please use GitHub Issues for bug reports and feature requests.
