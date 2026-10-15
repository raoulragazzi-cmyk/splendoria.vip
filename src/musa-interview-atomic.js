/**
 * Atomic optimistic turn write. Uses D1 batch transaction:
 * conditional version advance + conditional insert.
 * A repeated/stale request cannot create a second turn.
 */
export async function appendMuseTurnAtomic(db,sessionId,owner,{expectedVersion,content}={}){
 if(!db?.batch||!db?.prepare||!owner?.authorized||!owner.userId||!owner.projectId)throw Error("access_denied");
 if(typeof sessionId!=="string"||!sessionId||!Number.isSafeInteger(expectedVersion)||expectedVersion<0||expectedVersion>10000||typeof content!=="string"||!content.trim()||content.length>10000)throw Error("invalid_turn");
 const turnId=crypto.randomUUID(),claimToken=crypto.randomUUID(),now=new Date().toISOString();
 const claim=db.prepare(`UPDATE "MuseInterviewSession" SET "version"="version"+1,"lastWriteToken"=?,"updatedAt"=?
 WHERE "id"=? AND "userId"=? AND "projectId"=? AND "status"='active' AND "version"=?
 AND EXISTS(SELECT 1 FROM "BookProject" p WHERE p."id"="MuseInterviewSession"."projectId" AND p."userId"=?)`)
 .bind(claimToken,now,sessionId,owner.userId,owner.projectId,expectedVersion,owner.userId);
 const insert=db.prepare(`INSERT INTO "MuseInterviewTurn"("id","sessionId","ordinal","role","content")
 SELECT ?,s."id",COALESCE((SELECT MAX(t."ordinal") FROM "MuseInterviewTurn" t WHERE t."sessionId"=s."id"),0)+1,'author',?
 FROM "MuseInterviewSession" s WHERE s."id"=? AND s."userId"=? AND s."projectId"=?
 AND s."status"='active' AND s."version"=? AND s."lastWriteToken"=?
 AND EXISTS(SELECT 1 FROM "BookProject" p WHERE p."id"=s."projectId" AND p."userId"=?)`)
 .bind(turnId,content.trim(),sessionId,owner.userId,owner.projectId,expectedVersion+1,claimToken,owner.userId);
 const results=await db.batch([claim,insert]);
 if(Number(results?.[0]?.meta?.changes)!==1||Number(results?.[1]?.meta?.changes)!==1)throw Error("save_conflict");
 return {id:turnId,version:expectedVersion+1};
}
