-- Baseline additiva dello schema Splendoria.
-- Tutte le istruzioni sono idempotenti: i database esistenti restano intatti.

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "nome" TEXT NOT NULL DEFAULT '',
  "privacyAcceptedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Capitolo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "titolo" TEXT NOT NULL DEFAULT '',
  "genere" TEXT NOT NULL DEFAULT 'Autobiografia',
  "testo" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Ordine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "projectId" TEXT,
  "formula" TEXT NOT NULL,
  "prezzo" INTEGER NOT NULL,
  "stato" TEXT NOT NULL DEFAULT 'richiesta',
  "termsAcceptedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AiUsage" (
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "requests" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "date")
);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "lang" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "deliveryError" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS "BookProject_userId_idx" ON "BookProject"("userId");
CREATE INDEX IF NOT EXISTS "BookProject_status_idx" ON "BookProject"("status");

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
  UNIQUE ("projectId", "position")
);

CREATE INDEX IF NOT EXISTS "BookChapter_projectId_idx" ON "BookChapter"("projectId");

CREATE TABLE IF NOT EXISTS "BookInterview" (
  "projectId" TEXT NOT NULL PRIMARY KEY,
  "questions" TEXT NOT NULL DEFAULT '',
  "answers" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE
);
