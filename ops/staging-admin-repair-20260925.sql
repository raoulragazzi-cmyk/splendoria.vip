-- Repair only splendoria-v2-test (8bf872f6-3f9e-471f-95bc-a99a94f0d97c).
-- Preconditions: absent AdminLoginChallenge, AuditEvent, RegistrationNotification;
-- PasswordReset lacks deliveryStatus, deliveryError, deliveredAt, messageId.
-- Do not rerun ALTER statements after application. No rows are changed.

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

-- Registro tecnico privo di contenuti narrativi e dati anagrafici in chiaro.
-- Gli identificatori di attore e oggetto sono conservati soltanto come hash.
CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorHash" TEXT NOT NULL DEFAULT '',
  "actorRole" TEXT NOT NULL DEFAULT 'system',
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL DEFAULT '',
  "targetHash" TEXT NOT NULL DEFAULT '',
  "outcome" TEXT NOT NULL DEFAULT 'success',
  "metadata" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_action_idx" ON "AuditEvent"("action", "createdAt");

CREATE TABLE IF NOT EXISTS "RegistrationNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "nome" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "deliveryError" TEXT NOT NULL DEFAULT '',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TEXT,
  "acceptedAt" TEXT,
  "messageId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RegistrationNotification_userId_idx" ON "RegistrationNotification"("userId");
CREATE INDEX IF NOT EXISTS "RegistrationNotification_status_idx" ON "RegistrationNotification"("deliveryStatus", "attempts");


ALTER TABLE "PasswordReset" ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "PasswordReset" ADD COLUMN "deliveryError" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PasswordReset" ADD COLUMN "deliveredAt" TEXT;
ALTER TABLE "PasswordReset" ADD COLUMN "messageId" TEXT;