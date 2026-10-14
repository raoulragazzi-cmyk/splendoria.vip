-- Additive, isolated quota counters for Musa interview requests.
CREATE TABLE IF NOT EXISTS "MuseRequestQuota" (
 "userId" TEXT NOT NULL,
 "windowId" INTEGER NOT NULL,
 "requests" INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY ("userId","windowId"),
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
