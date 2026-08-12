-- Schema storico conservato come riferimento.
-- Le nuove installazioni e gli aggiornamenti usano i file versionati in migrations/.

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
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "deliveryError" TEXT NOT NULL DEFAULT '',
  "deliveredAt" TEXT,
  "messageId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX IF NOT EXISTS "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

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

-- Per database creati con una versione precedente, applicare una sola volta:
-- ALTER TABLE "PasswordReset" ADD COLUMN "usedAt" TEXT;
-- ALTER TABLE "PasswordReset" ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'pending';
-- ALTER TABLE "PasswordReset" ADD COLUMN "deliveryError" TEXT NOT NULL DEFAULT '';
-- ALTER TABLE "PasswordReset" ADD COLUMN "deliveredAt" TEXT;
-- ALTER TABLE "PasswordReset" ADD COLUMN "messageId" TEXT;

CREATE TABLE IF NOT EXISTS "AuthThrottle" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TEXT NOT NULL,
  "blockedUntil" TEXT,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Aggiunta versionata in migrations/0003_email_verification.sql:
-- ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TEXT;
CREATE TABLE IF NOT EXISTS "EmailVerification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "usedAt" TEXT,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "deliveryError" TEXT NOT NULL DEFAULT '',
  "deliveredAt" TEXT,
  "messageId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmailVerification_userId_idx" ON "EmailVerification"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");

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

CREATE TABLE IF NOT EXISTS "ProjectAdmin" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "statoEditoriale" TEXT NOT NULL DEFAULT 'iniziato',
  "statoCommerciale" TEXT NOT NULL DEFAULT 'gratuito',
  "tutor" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Gestione per singolo libro. La tabella storica ProjectAdmin resta intatta
-- per compatibilità, ma i nuovi permessi commerciali sono legati al progetto.
CREATE TABLE IF NOT EXISTS "BookProjectAdmin" (
  "projectId" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "statoEditoriale" TEXT NOT NULL DEFAULT 'iniziato',
  "statoCommerciale" TEXT NOT NULL DEFAULT 'prova_gratuita',
  "tutor" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookProjectAdmin_userId_idx" ON "BookProjectAdmin"("userId");

-- Eseguire una sola volta sui database già esistenti:
-- ALTER TABLE "Ordine" ADD COLUMN "projectId" TEXT;

CREATE TABLE IF NOT EXISTS "BookProject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "genre" TEXT NOT NULL DEFAULT 'Autobiografia',
  "tone" TEXT NOT NULL DEFAULT 'Emozionante e autentico',
  "audience" TEXT NOT NULL DEFAULT 'Famiglia e amici',
  "targetPages" INTEGER NOT NULL DEFAULT 80,
  "sourceMaterial" TEXT NOT NULL DEFAULT '',
  "story" TEXT NOT NULL DEFAULT '',
  "people" TEXT NOT NULL DEFAULT '',
  "events" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'bozza',
  "plan" TEXT NOT NULL DEFAULT 'free',
  "specialDataConsentAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Colonne additive già presenti in produzione e documentate nella baseline versionata:
-- ALTER TABLE "User" ADD COLUMN "privacyAcceptedAt" TEXT;
-- ALTER TABLE "Ordine" ADD COLUMN "termsAcceptedAt" TEXT;
-- ALTER TABLE "BookProject" ADD COLUMN "specialDataConsentAt" TEXT;
-- ALTER TABLE "BookProject" ADD COLUMN "sourceMaterial" TEXT NOT NULL DEFAULT '';

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
