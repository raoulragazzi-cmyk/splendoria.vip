/**
 * Persistence adapter; callers MUST authenticate and verify that userId owns
 * projectId before invoking any function. Not routed to public HTTP endpoints.
 */
import { validateInterviewInput } from "./musa-interview-policy.js";
const id = () => crypto.randomUUID();
export async function createMuseSession(db, input, owner) {
 if (!db?.prepare || !owner?.authorized || !owner.userId || !owner.projectId) throw new Error("access_denied");
 const { locale, track } = validateInterviewInput({...input,turns:[]});
 const sid = id();
 await db.prepare('INSERT INTO "MuseInterviewSession" ("id","projectId","userId","locale","track") VALUES (?,?,?,?,?)')
  .bind(sid,owner.projectId,owner.userId,locale,track).run();
 return {id:sid,locale,track,version:0};
}
export async function listMuseTurns(db, sessionId, owner) {
 if (!db?.prepare || !owner?.authorized || !owner.userId || !owner.projectId || !sessionId) throw new Error("access_denied");
 const row=await db.prepare('SELECT "id","locale","track","status","version" FROM "MuseInterviewSession" WHERE "id"=? AND "projectId"=? AND "userId"=?')
  .bind(sessionId,owner.projectId,owner.userId).first();
 if (!row) throw new Error("not_found");
 const turns=await db.prepare('SELECT "id","ordinal","role","content","authorApproved" FROM "MuseInterviewTurn" WHERE "sessionId"=? ORDER BY "ordinal" ASC')
  .bind(sessionId).all();
 return {session:row,turns:turns.results||[]};
}
/**
 * Write transaction is a single conditional INSERT ... SELECT, ensuring that
 * a competing session update cannot commit a turn without a matching owner.
 * Caller supplies ordinal, bounded by a unique DB constraint. On conflict,
 * caller must re-fetch rather than silently duplicating a turn.
 */
export async function appendMuseAuthorTurn(db, sessionId, owner, ordinal, content) {
 if (!db?.prepare || !owner?.authorized || !owner.userId || !owner.projectId) throw new Error("access_denied");
 if (!sessionId || !Number.isSafeInteger(ordinal) || ordinal<1 || ordinal>200 || typeof content!=="string" || !content.trim() || content.length>10000) throw new Error("invalid_turn");
 const tid=id();
 const result=await db.prepare(`INSERT INTO "MuseInterviewTurn" ("id","sessionId","ordinal","role","content")
 SELECT ?,s."id",?,'author',? FROM "MuseInterviewSession" s
 WHERE s."id"=? AND s."projectId"=? AND s."userId"=? AND s."status"='active'`)
  .bind(tid,sessionId,ordinal,content.trim(),sessionId,owner.projectId,owner.userId).run();
 if (result?.meta?.changes!==1) throw new Error("not_saved");
 return {id:tid,ordinal};
}
