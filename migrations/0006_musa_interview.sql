-- Musa interview sessions: additive only. NOT applied automatically.
CREATE TABLE IF NOT EXISTS "MuseInterviewSession" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "projectId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "locale" TEXT NOT NULL CHECK ("locale" IN ('it','de','en')),
 "track" TEXT NOT NULL CHECK ("track" IN ('life','family','enterprise','turning_point')),
 "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active','paused','completed')),
 "version" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE,
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_muse_session_owner" ON "MuseInterviewSession"("projectId","userId","updatedAt");
CREATE TABLE IF NOT EXISTS "MuseInterviewTurn" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "sessionId" TEXT NOT NULL REFERENCES "MuseInterviewSession"("id") ON DELETE CASCADE,
 "ordinal" INTEGER NOT NULL,
 "role" TEXT NOT NULL CHECK ("role" IN ('author','musa')),
 "content" TEXT NOT NULL CHECK(length("content") BETWEEN 1 AND 10000),
 "authorApproved" INTEGER NOT NULL DEFAULT 0 CHECK ("authorApproved" IN (0,1)),
 "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE("sessionId","ordinal")
);
CREATE INDEX IF NOT EXISTS "idx_muse_turn_session" ON "MuseInterviewTurn"("sessionId","ordinal");
