import sqlite3, pathlib, re, unittest
sql = pathlib.Path("src/musa-interview-quota.js").read_text()
match = re.search(r'db\.prepare\(`(.*?)`\)',sql,re.S)
assert match, "Cannot extract production quota SQL"
QUERY=match.group(1)
class TestQuota(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(":memory:")
  self.db.executescript('CREATE TABLE "MuseRequestQuota" ("userId" TEXT NOT NULL,"windowId" INTEGER NOT NULL,"requests" INTEGER NOT NULL DEFAULT 0,PRIMARY KEY("userId","windowId"));')
 def request(self,user,window,max_count=3):
  cur=self.db.execute(QUERY,(user,window,max_count))
  return cur.rowcount==1
 def test_allow_then_reject(self):
  self.assertTrue(all(self.request("u1",1) for _ in range(3)))
  self.assertFalse(self.request("u1",1))
  self.assertEqual(self.db.execute('SELECT "requests" FROM "MuseRequestQuota"').fetchone()[0],3)
 def test_user_and_window_isolation(self):
  self.assertTrue(all(self.request("u1",1) for _ in range(3)))
  self.assertTrue(self.request("u2",1))
  self.assertTrue(self.request("u1",2))
 def test_cleanup_old_windows_only(self):
  for n in (1,2,3): self.request("u1",n)
  self.db.execute('DELETE FROM "MuseRequestQuota" WHERE "windowId"<?',(3,))
  self.assertEqual(self.db.execute('SELECT "windowId" FROM "MuseRequestQuota"').fetchall(),[(3,)])
if __name__=="__main__": unittest.main()
