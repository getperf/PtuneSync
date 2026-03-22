## ptune-task Logging Policy

### Purpose

Logging is used for debugging and understanding runtime behavior.

Logs should allow developers and LLM tools to understand execution flow.

---

### Logging Scope

Logs should be added in:

- UseCases
- important Services
- Repositories
- external integrations

Logs are usually not required for helpers or builders.

---

### Execution Flow Logging

Each UseCase should log start and end.

Example

[UseCase:start] PullAndMergeTodayUseCase  
[UseCase:end] PullAndMergeTodayUseCase

---

### Behavior Logging

Important steps should log meaningful information.

Examples

[Service] TaskTreeService.merge tasks=14  
[Repository] DailyNoteRepository.save updated=true  
[Sync] PtuneSyncClient.pull listId=mytasks

Prefer logging:

- counts
- identifiers
- status flags

Avoid logging large documents.

---

### Log Tags

Use standard tags.

[UseCase]  
[Service]  
[Repository]  
[Sync]  
[Command]

These tags help identify architecture layers.

---

### Log Levels

debug  detailed execution logs  
info   high-level operations  
warn   recoverable issues  
error  failures

Debug logs may be verbose during development.

---

### Example

UseCase

const logger = Logger.get()

logger.debug("[UseCase:start] PullAndMergeTodayUseCase")

Service

logger.debug("[Service] TaskTreeService.merge tasks=14")

Repository

logger.debug("[Repository] DailyNoteRepository.save updated=true")

---

### Goal

Logs should make it possible to understand:

- which UseCase ran
- which services executed
- what operations occurred