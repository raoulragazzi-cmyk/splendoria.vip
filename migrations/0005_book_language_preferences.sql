-- Preferenze linguistiche additive per progetto.
-- Nessuna colonna esistente viene modificata: i libri attuali restano italiani per default.

CREATE TABLE IF NOT EXISTS "BookLanguagePreference" (
  "projectId" TEXT NOT NULL PRIMARY KEY,
  "bookLanguage" TEXT NOT NULL DEFAULT 'it-IT',
  "museOutputLanguage" TEXT NOT NULL DEFAULT 'it-IT',
  "dictationLanguage" TEXT NOT NULL DEFAULT 'it-IT',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookLanguagePreference_updatedAt_idx"
  ON "BookLanguagePreference"("updatedAt");
