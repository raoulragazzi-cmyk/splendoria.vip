"""SQLite integration regression for the D1-style Musa write claim SQL.

The test uses the exact SQL extracted from the JavaScript module, not a copy.
It does not replace real Cloudflare D1 staging verification.
"""
import pathlib, re, sqlite3, unittest
SOURCE = pathlib.Path("src/musa-interview-atomic.js").read_text()
SQL = re.findall(r'db\.prepare\(`(.*?)`\)', SOURCE, flags=re.S)
assert len(SQL) == 2, "Expected exactly two D1 prepared write statements"

class MusaWriteSQL(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript("""
          CREATE TABLE "BookProject" ("id" TEXT PRIMARY KEY, "userId" TEXT);
          CREATE TABLE "MuseInterviewSession" ("id" TEXT PRIMARY KEY, "userId" TEXT,
            "projectId" TEXT, "status" TEXT, "version" INTEGER, "lastWriteToken" TEXT, "updatedAt" TEXT);
          CREATE TABLE "MuseInterviewTurn" ("id" TEXT PRIMARY KEY, "sessionId" TEXT,
            "ordinal" INTEGER, "role" TEXT, "content" TEXT, UNIQUE("sessionId","ordinal"));
          INSERT INTO "BookProject" VALUES ('book-1','owner-1');
          INSERT INTO "MuseInterviewSession" VALUES ('session-1','owner-1','book-1','active',0,NULL,NULL);
        """)
    def attempt(self,version,token,owner="owner-1",content="a memory"):
        self.db.execute("BEGIN")
        first=self.db.execute(SQL[0],(token,"2026-10-12T12:00:00Z","session-1",owner,"book-1",version,owner))
        changed_first=first.rowcount
        second=self.db.execute(SQL[1],("turn-"+token,content,"session-1",owner,"book-1",version+1,token,owner))
        changed_second=second.rowcount
        if changed_first != 1 or changed_second != 1:
            self.db.rollback()
            return False
        self.db.commit()
        return True
    def test_stale_retry_does_not_duplicate(self):
        self.assertTrue(self.attempt(0,"claim-a"))
        self.assertFalse(self.attempt(0,"claim-b"))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM "MuseInterviewTurn"').fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT "version" FROM "MuseInterviewSession"').fetchone()[0],1)
    def test_authorization_boundary(self):
        self.assertFalse(self.attempt(0,"other-owner",owner="attacker"))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM "MuseInterviewTurn"').fetchone()[0],0)
    def test_paused_session(self):
        self.db.execute('UPDATE "MuseInterviewSession" SET "status"=?',("paused",))
        self.db.commit()
        self.assertFalse(self.attempt(0,"paused"))
    def test_progressive_ordinals(self):
        self.assertTrue(self.attempt(0,"first"))
        self.assertTrue(self.attempt(1,"second"))
        self.assertEqual(self.db.execute('SELECT "ordinal" FROM "MuseInterviewTurn" ORDER BY "ordinal"').fetchall(),[(1,),(2,)])
    def test_failure_rolls_back_claim(self):
        self.db.execute('DROP TABLE "MuseInterviewTurn"')
        self.db.commit()
        with self.assertRaises(sqlite3.OperationalError):
            self.attempt(0,"broken")
        self.db.rollback()
        self.assertEqual(self.db.execute('SELECT "version" FROM "MuseInterviewSession"').fetchone()[0],0)

if __name__ == "__main__":
    unittest.main()
