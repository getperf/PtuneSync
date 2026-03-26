PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  list_name TEXT NOT NULL,
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
  last_pulled_at TEXT,
  last_pushed_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_histories (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  status TEXT NOT NULL,
  list_name TEXT NOT NULL,
  daily_note_key TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS task_histories (
  history_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  list_name TEXT NOT NULL,
  daily_note_key TEXT,
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

CREATE INDEX IF NOT EXISTS idx_task_histories_sync_history_id
  ON task_histories(sync_history_id);

CREATE INDEX IF NOT EXISTS idx_task_histories_daily_note_key
  ON task_histories(daily_note_key, list_name, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at
  ON tasks(deleted_at);

CREATE INDEX IF NOT EXISTS idx_tasks_list_name
  ON tasks(list_name);

CREATE INDEX IF NOT EXISTS idx_sync_histories_command_status_started_at
  ON sync_histories(command, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_histories_daily_note_key
  ON sync_histories(daily_note_key, list_name, completed_at DESC);
