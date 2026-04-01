ALTER TABLE tasks ADD COLUMN list_name TEXT NOT NULL DEFAULT '_Today';
ALTER TABLE tasks ADD COLUMN last_pulled_at TEXT;
ALTER TABLE tasks ADD COLUMN last_pushed_at TEXT;

CREATE TABLE sync_histories_v4 (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  list_name TEXT NOT NULL DEFAULT '_Today',
  daily_note_key TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  note TEXT
);

INSERT INTO sync_histories_v4 (
  id,
  command,
  status,
  list_name,
  daily_note_key,
  started_at,
  completed_at,
  accepted_count,
  added_count,
  updated_count,
  deleted_count,
  note
)
SELECT
  id,
  sync_type,
  'success',
  '_Today',
  CASE
    WHEN sync_type = 'review' THEN substr(executed_at, 1, 10)
    ELSE NULL
  END,
  executed_at,
  executed_at,
  total_tasks,
  0,
  completed_tasks,
  deleted_tasks,
  note
FROM sync_histories;

DROP TABLE sync_histories;
ALTER TABLE sync_histories_v4 RENAME TO sync_histories;

ALTER TABLE task_histories ADD COLUMN list_name TEXT NOT NULL DEFAULT '_Today';
ALTER TABLE task_histories ADD COLUMN daily_note_key TEXT;

UPDATE task_histories
SET daily_note_key = (
  SELECT sh.daily_note_key
  FROM sync_histories sh
  WHERE sh.id = task_histories.sync_history_id
)
WHERE daily_note_key IS NULL;

CREATE INDEX IF NOT EXISTS idx_task_histories_sync_history_id
  ON task_histories(sync_history_id);

CREATE INDEX IF NOT EXISTS idx_task_histories_daily_note_key
  ON task_histories(daily_note_key, list_name, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_list_name
  ON tasks(list_name);

CREATE INDEX IF NOT EXISTS idx_sync_histories_command_status_started_at
  ON sync_histories(command, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_histories_daily_note_key
  ON sync_histories(daily_note_key, list_name, completed_at DESC);
