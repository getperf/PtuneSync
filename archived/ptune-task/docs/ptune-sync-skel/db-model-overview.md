# Database Model Overview

## 1. Purpose

SQLite database is used for:

- Backup
- Change detection
- Task analysis / review
- Historical snapshots

The database schema is NOT part of the public CLI contract.

---

## 2. Core Domain Models

### MyTask

Represents current task state.

### TaskHistory

Represents snapshot of task at sync time.

### SyncHistory

Represents one synchronization execution.

---

## 3. Command vs Database Behavior

| Command | tasks table | task_history | sync_history |
|----------|------------|-------------|--------------|
| auth | no | no | no |
| pull | upsert + soft delete | optional snapshot | record |
| diff | no | no | no |
| push | planned update | snapshot | record |

---

## 4. Pull Behavior

1. Fetch all tasks from Google
2. Upsert into local DB
3. Soft delete missing tasks
4. Record sync timestamp

---

## 5. Push Behavior (Planned)

1. Update Google Tasks
2. Save snapshot to task_history
3. Record sync_history entry

---

## 6. Stability Policy

Database structure may evolve without breaking CLI contract.
Only JSON contract is stable.
