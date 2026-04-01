## ptune-task Architecture Policy

### Architecture Style

ptune-task follows a simplified Clean Architecture.

The system is structured around:

- Command
- UseCase
- Service
- Repository
- Infrastructure

Dependencies should flow inward.

Command → UseCase → Service → Repository

Infrastructure implementations are injected from outside.

---

### Command

Commands are the entry points triggered by UI or CLI.

Responsibilities

- receive user input
- call a UseCase
- pass results to a presenter

Commands should not contain business logic.

---

### UseCase

UseCases represent application actions.

Examples

- PullAndMergeTodayUseCase
- PushAndRebuildDailyNoteUseCase

Responsibilities

- orchestrate application flow
- call services and repositories
- handle domain operations

UseCases should remain small and readable.

Avoid putting heavy logic inside UseCases.

---

### Service

Services contain domain logic.

Examples

- TaskTreeService
- HabitService

Responsibilities

- domain operations
- data transformation
- reusable logic

Services should not depend on UI or infrastructure.

Prefer grouping related logic in one service class instead of creating many small services.

Example

Good

TaskTreeService.merge()

Avoid

MergeTaskTreeService

---

### Repository

Repositories handle persistence.

Examples

- DailyNoteRepository
- TaskRepository

Responsibilities

- read/write domain objects
- isolate storage access

Repositories should not contain business logic.

---

### Builder

Builders create formatted outputs such as Markdown.

Examples

- PlannedTaskSectionBuilder
- DailyTemplateBuilder

Builders should only format data.

They should not perform domain decisions.

---

### Design Guidelines

Prefer simple and readable code.

Avoid:

- excessive class splitting
- unnecessary dependency injection
- complex container structures

A small number of clear services is preferred over many tiny classes.

---

### Goal

The architecture should prioritize:

- readability
- maintainability
- clear execution flow