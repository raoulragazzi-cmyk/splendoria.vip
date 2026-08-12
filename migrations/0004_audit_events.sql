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
