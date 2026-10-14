import pathlib, sqlite3, unittest

MIGRATIONS=pathlib.Path("migrations")
class MusaDeletionLifecycle(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(":memory:")
  self.db.execute("PRAGMA foreign_keys=ON")
  self.db.executescript("""
    CREATE TABLE "User" ("id" TEXT PRIMARY KEY NOT NULL);
    CREATE TABLE "BookProject" ("id" TEXT PRIMARY KEY NOT NULL,"userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE);
  """)
  for name in ("0006_musa_interview.sql","0007_musa_ai_consent.sql","0008_musa_write_claim.sql","0009_musa_request_quota.sql"):
   self.db.executescript((MIGRATIONS/name).read_text())
  self.db.execute('INSERT INTO "User" VALUES (?)',("synthetic-user",))
  self.db.execute('INSERT INTO "BookProject" VALUES (?,?)',("synthetic-book","synthetic-user"))
  self.db.execute('INSERT INTO "MuseInterviewSession"("id","projectId","userId","locale","track") VALUES (?,?,?,?,?)',("synthetic-session","synthetic-book","synthetic-user","it","life"))
  self.db.execute('INSERT INTO "MuseInterviewTurn"("id","sessionId","ordinal","role","content") VALUES (?,?,?,?,?)',("synthetic-turn","synthetic-session",1,"author","A memory"))
  self.db.execute('INSERT INTO "MuseInterviewConsent"("sessionId","userId","consentVersion","grantedAt") VALUES (?,?,?,?)',("synthetic-session","synthetic-user","v1","2026-10-14"))
  self.db.execute('INSERT INTO "MuseRequestQuota" VALUES (?,?,?)',("synthetic-user",5,2))
  self.db.commit()
 def count(self,table):
  if table not in {"MuseInterviewSession","MuseInterviewTurn","MuseInterviewConsent","MuseRequestQuota"}:raise ValueError(table)
  return self.db.execute('SELECT COUNT(*) FROM "'+table+'"').fetchone()[0]
 def test_book_deletion_removes_interview_and_consent(self):
  self.db.execute('DELETE FROM "BookProject" WHERE "id"=?',("synthetic-book",))
  self.assertEqual(self.count("MuseInterviewSession"),0)
  self.assertEqual(self.count("MuseInterviewTurn"),0)
  self.assertEqual(self.count("MuseInterviewConsent"),0)
  self.assertEqual(self.count("MuseRequestQuota"),1)
 def test_account_deletion_removes_all_records(self):
  self.db.execute('DELETE FROM "User" WHERE "id"=?',("synthetic-user",))
  for table in ("MuseInterviewSession","MuseInterviewTurn","MuseInterviewConsent","MuseRequestQuota"):
   self.assertEqual(self.count(table),0)
if __name__=="__main__":unittest.main()
