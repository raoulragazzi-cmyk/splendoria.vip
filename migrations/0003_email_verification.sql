-- Verifica dell’indirizzo email per i nuovi account.
-- Gli account già presenti sono considerati verificati per non interrompere
-- i progetti esistenti; le nuove registrazioni lasciano il campo a NULL.

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TEXT;

UPDATE "User"
SET "emailVerifiedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "emailVerifiedAt" IS NULL;

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
