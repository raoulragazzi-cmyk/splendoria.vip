import assert from "node:assert/strict";
import { createMuseSession, listMuseTurns, appendMuseAuthorTurn } from "../src/musa-interview-store.js";

const calls = [];
let projectExists = true, sessionExists = true, changes = 1;
const db = { prepare(sql) {
  return { args: [], bind(...values) { this.args = values; return this; },
    async first() {
      calls.push({ sql, args: this.args });
      if (sql.includes('FROM "BookProject"')) return projectExists ? { id: "p1" } : null;
      if (sql.includes('FROM "MuseInterviewSession"')) return sessionExists ? { id: "s1", version: 0 } : null;
      return null;
    },
    async all() { calls.push({ sql, args: this.args }); return { results: [] }; },
    async run() { calls.push({ sql, args: this.args }); return { meta: { changes } }; }
  };
}};
const owner = { authorized: true, userId: "u1", projectId: "p1" };
for (const operation of [
 () => createMuseSession(db, { locale:"it", track:"life" }, { ...owner, authorized:false }),
 () => listMuseTurns(db, "s1", { ...owner, authorized:false }),
 () => appendMuseAuthorTurn(db, "s1", { ...owner, authorized:false }, 1, "memory")
]) await assert.rejects(operation(), /access_denied/);

projectExists = false;
await assert.rejects(createMuseSession(db, { locale:"it", track:"life" }, owner), /not_found/);
projectExists = true;
const session = await createMuseSession(db, { locale:"it", track:"life" }, owner);
assert.ok(session.id);
assert.ok(calls.some(c=>c.sql.includes('FROM "BookProject"') && c.args[0]==="p1" && c.args[1]==="u1"));

sessionExists = false;
await assert.rejects(listMuseTurns(db, "s1", owner), /not_found/);
sessionExists = true;
assert.equal((await listMuseTurns(db, "s1", owner)).session.id, "s1");
const query = calls.find(c=>c.sql.includes('FROM "MuseInterviewSession"'));
assert.ok(query.sql.includes('EXISTS (SELECT 1 FROM "BookProject"'));
assert.deepEqual(query.args, ["s1","p1","u1","u1"]);

for (const [n, body] of [[0,"memory"],[201,"memory"],[1," "],[1,"x".repeat(10001)]])
 await assert.rejects(appendMuseAuthorTurn(db,"s1",owner,n,body),/invalid_turn/);
changes=0;
await assert.rejects(appendMuseAuthorTurn(db,"s1",owner,1,"memory"),/not_saved/);
changes=1;
assert.equal((await appendMuseAuthorTurn(db,"s1",owner,1,"memory")).ordinal,1);
const insert = calls.find(c=>c.sql.includes('INSERT INTO "MuseInterviewTurn"'));
assert.ok(insert.sql.includes('EXISTS (SELECT 1 FROM "BookProject"'));
assert.deepEqual(insert.args.slice(-4),["s1","p1","u1","u1"]);
console.log("Musa persistence owner-scoping tests passed");
