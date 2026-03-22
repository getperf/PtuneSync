## ptune-task Development Policy

### General Principle

Prefer simple and readable code.

Do not introduce unnecessary abstractions.

Avoid creating many small classes unless they represent clear domain concepts.

---

### Service Design

Related logic should be grouped into a single service.

Example

TaskTreeService

Methods

- merge
- build
- normalize

Avoid splitting these into separate service classes.

Bad example

MergeTaskTreeService  
TaskTreeBuilderService  
TaskTreeNormalizerService

---

### Dependency Injection

Dependency injection should be minimal.

Use DI only for:

- repositories
- infrastructure integrations
- configuration objects

Avoid injecting small utility services.

Prefer creating them directly.

Example

Good

new TaskTreeService()

Avoid

container.createTaskTreeService()

---

### UseCase Design

UseCases should:

- orchestrate operations
- remain easy to read
- avoid complex logic

Prefer calling services instead of implementing logic directly.

---

### Code Size

Prefer fewer files with clear responsibility rather than many tiny classes.

Avoid creating classes that contain only one trivial method.

---

### Refactoring Rule

Before creating new classes, consider:

- can the logic be added to an existing service?
- does this represent a real domain concept?

If not, keep the code inside the existing class.

---

### Goal

The system should remain:

- easy to understand
- easy to modify
- easy for LLM tools to analyze