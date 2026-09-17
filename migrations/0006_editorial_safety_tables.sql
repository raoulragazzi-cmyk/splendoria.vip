-- Splendoria D1 migration 0006
-- Version the editorial safety tables that are already created defensively at runtime.
-- Keep this schema byte-for-byte compatible with ensureEditorialSafetyTables() semantics:
-- additive only, no new foreign keys or destructive changes.

CREATE TABLE IF NOT EXISTS "BookChapterSection" (
  chapterId TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  section0 TEXT NOT NULL DEFAULT '',
  section1 TEXT NOT NULL DEFAULT '',
  section2 TEXT NOT NULL DEFAULT '',
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "BookChapterSection_project_idx"
  ON "BookChapterSection" (projectId);

CREATE TABLE IF NOT EXISTS "BookProjectBackup" (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  userId TEXT NOT NULL,
  snapshotJson TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "BookProjectBackup_project_idx"
  ON "BookProjectBackup" (projectId, createdAt DESC);
