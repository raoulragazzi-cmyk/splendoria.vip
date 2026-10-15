/**
 * Conservative D1-backed request quota. Authenticated users only.
 * One atomic UPSERT counts attempted writes, including invalid writes.
 * Fail closed if the quota table cannot be read.
 */
export async function checkMuseWriteQuota(db,userId,{max=20,windowSeconds=60,now=Date.now()}={}){
 if(!db?.prepare||typeof userId!=="string"||!userId)throw Error("quota_unavailable");
 const windowId=Math.floor(now/(windowSeconds*1000));
 const result=await db.prepare(`INSERT INTO "MuseRequestQuota" ("userId","windowId","requests")
 VALUES (?,?,1)
 ON CONFLICT("userId","windowId") DO UPDATE SET "requests"="requests"+1
 WHERE "requests"<?`).bind(userId,windowId,max).run();
 return Number(result?.meta?.changes)===1;
}
