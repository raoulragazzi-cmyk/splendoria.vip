/**
 * State transitions for an authenticated Muse interview.
 * The owner identity must come from resolveMuseOwner, not request JSON.
 */
export async function changeMuseSessionStatus(db,sessionId,owner,action,expectedVersion){
 if(!db?.prepare||!owner?.authorized||!owner.userId||!owner.projectId)throw Error("access_denied");
 if(!sessionId||!Number.isSafeInteger(expectedVersion)||expectedVersion<0)throw Error("invalid_version");
 const transitions={pause:["active","paused"],resume:["paused","active"],complete:["active","completed"]};
 const transition=transitions[action];
 if(!transition)throw Error("invalid_action");
 const result=await db.prepare(`UPDATE "MuseInterviewSession" SET "status"=?,"version"="version"+1,"updatedAt"=?
 WHERE "id"=? AND "projectId"=? AND "userId"=? AND "status"=? AND "version"=?
 AND EXISTS(SELECT 1 FROM "BookProject" p WHERE p."id"="MuseInterviewSession"."projectId" AND p."userId"=?)`)
  .bind(transition[1],new Date().toISOString(),sessionId,owner.projectId,owner.userId,transition[0],expectedVersion,owner.userId).run();
 if(Number(result?.meta?.changes)!==1)throw Error("state_conflict");
 return {status:transition[1],version:expectedVersion+1};
}
