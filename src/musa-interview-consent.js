/**
 * Server-side Musa AI consent. Only call with an authenticated owner resolved
 * from Splendoria sessions; never trust owner data from a browser payload.
 */
export async function getMuseAiConsent(db,sessionId,owner,version="v1"){
 if(!db?.prepare||!owner?.authorized||!owner.userId||!owner.projectId||!sessionId)return false;
 const row=await db.prepare(`SELECT c."grantedAt",c."revokedAt",c."consentVersion"
 FROM "MuseInterviewConsent" c
 JOIN "MuseInterviewSession" s ON s."id"=c."sessionId"
 JOIN "BookProject" p ON p."id"=s."projectId" AND p."userId"=s."userId"
 WHERE c."sessionId"=? AND c."userId"=? AND s."userId"=? AND s."projectId"=?`)
 .bind(sessionId,owner.userId,owner.userId,owner.projectId).first();
 return Boolean(row?.grantedAt&&!row?.revokedAt&&row.consentVersion===version);
}
export async function setMuseAiConsent(db,sessionId,owner,grant,version="v1"){
 if(!db?.prepare||!owner?.authorized||!owner.userId||!owner.projectId||!sessionId||typeof grant!=="boolean")throw Error("access_denied");
 const now=new Date().toISOString();
 const result=await db.prepare(`INSERT INTO "MuseInterviewConsent" ("sessionId","userId","consentVersion","grantedAt","revokedAt","updatedAt")
 SELECT s."id",s."userId",?,?,?,? FROM "MuseInterviewSession" s
 JOIN "BookProject" p ON p."id"=s."projectId" AND p."userId"=s."userId"
 WHERE s."id"=? AND s."userId"=? AND s."projectId"=?
 ON CONFLICT("sessionId") DO UPDATE SET
 "consentVersion"=excluded."consentVersion",
 "grantedAt"=excluded."grantedAt",
 "revokedAt"=excluded."revokedAt",
 "updatedAt"=excluded."updatedAt"
 WHERE "MuseInterviewConsent"."userId"=excluded."userId"`)
 .bind(version,grant?now:null,grant?null:now,now,sessionId,owner.userId,owner.projectId).run();
 if(Number(result?.meta?.changes)!==1)throw Error("consent_not_saved");
 return {consented:grant,consentVersion:version};
}
