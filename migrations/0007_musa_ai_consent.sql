-- Separate, revocable permission to use interview memories as AI context.
-- Additive migration; do not apply to production without release approval.
CREATE TABLE IF NOT EXISTS "MuseInterviewConsent" (
  "sessionId" TEXT NOT NULL PRIMARY KEY REFERENCES "MuseInterviewSession"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "grantedAt" TEXT,
  "revokedAt" TEXT,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_muse_consent_user" ON "MuseInterviewConsent"("userId");
