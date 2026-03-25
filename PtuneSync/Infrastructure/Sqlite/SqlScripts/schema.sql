PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  parent TEXT,
  started TEXT,
  completed TEXT,
  pomodoro_planned INTEGER,
  pomodoro_actual REAL,
  review_flags_json TEXT,
  goal TEXT,
  tags_json TEXT,
  google_updated_at TEXT,
  last_synced_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_histories (
  id TEXT PRIMARY KEY,
  executed_at TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  deleted_tasks INTEGER NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS task_histories (
  history_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  parent TEXT,
  started TEXT,
  completed TEXT,
  pomodoro_planned INTEGER,
  pomodoro_actual REAL,
  review_flags_json TEXT,
  goal TEXT,
  tags_json TEXT,
  snapshot_at TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  sync_history_id TEXT NOT NULL,
  deleted_at TEXT,
  google_updated_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (sync_history_id) REFERENCES sync_histories(id)
);

CREATE INDEX IF NOT EXISTS idx_task_histories_task_id
  ON task_histories(task_id);

CREATE INDEX IF NOT EXISTS idx_task_histories_snapshot_at
  ON task_histories(snapshot_at);

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at
  ON tasks(deleted_at);
