-- Per-project narrative language preference for Splendoria Studio.
-- Additive only: no existing column/table is modified and existing projects default to Italian.

CREATE TABLE IF NOT EXISTS "BookProjectLanguage" (
  "projectId" TEXT NOT NULL PRIMARY KEY,
  "bookLanguage" TEXT NOT NULL DEFAULT 'it',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE,
  CHECK ("bookLanguage" IN ('it', 'de', 'en'))
);

CREATE INDEX IF NOT EXISTS "BookProjectLanguage_language_idx"
  ON "BookProjectLanguage"("bookLanguage");
