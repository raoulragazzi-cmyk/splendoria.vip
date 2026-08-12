-- Secondo fattore per l’accesso all’area amministratore.

CREATE TABLE IF NOT EXISTS "AdminLoginChallenge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "usedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminLoginChallenge_userId_idx" ON "AdminLoginChallenge"("userId");
CREATE INDEX IF NOT EXISTS "AdminLoginChallenge_expiresAt_idx" ON "AdminLoginChallenge"("expiresAt");
