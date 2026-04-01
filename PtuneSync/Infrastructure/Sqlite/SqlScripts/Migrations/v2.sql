ALTER TABLE tasks ADD COLUMN goal TEXT;
ALTER TABLE tasks ADD COLUMN tags_json TEXT;
ALTER TABLE task_histories ADD COLUMN goal TEXT;
ALTER TABLE task_histories ADD COLUMN tags_json TEXT;
