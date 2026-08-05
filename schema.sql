-- Le tabelle User, Capitolo, Ordine, AiUsage e ContactMessage esistono già.
-- Questa migrazione è additiva e non elimina né modifica dati esistenti.

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "usedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX IF NOT EXISTS "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

CREATE TABLE IF NOT EXISTS "AuthThrottle" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TEXT NOT NULL,
  "blockedUntil" TEXT,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProjectAdmin" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "statoEditoriale" TEXT NOT NULL DEFAULT 'iniziato',
  "statoCommerciale" TEXT NOT NULL DEFAULT 'gratuito',
  "tutor" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "BookProject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "genre" TEXT NOT NULL DEFAULT 'Autobiografia',
  "tone" TEXT NOT NULL DEFAULT 'Emozionante e autentico',
  "audience" TEXT NOT NULL DEFAULT 'Famiglia e amici',
  "targetPages" INTEGER NOT NULL DEFAULT 80,
  "story" TEXT NOT NULL DEFAULT '',
  "people" TEXT NOT NULL DEFAULT '',
  "events" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'bozza',
  "plan" TEXT NOT NULL DEFAULT 'free',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookProject_userId_idx" ON "BookProject"("userId");
CREATE INDEX IF NOT EXISTS "BookProject_status_idx" ON "BookProject"("status");

CREATE TABLE IF NOT EXISTS "BookChapter" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'da_generare',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE,
  UNIQUE("projectId", "position")
);

CREATE INDEX IF NOT EXISTS "BookChapter_projectId_idx" ON "BookChapter"("projectId");

CREATE TABLE IF NOT EXISTS "BookInterview" (
  "projectId" TEXT NOT NULL PRIMARY KEY,
  "questions" TEXT NOT NULL DEFAULT '',
  "answers" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE
);
