/**
 * Optional maintenance operation, never triggered by reading or writing a story.
 * Called only by an explicitly configured staging maintenance job.
 */
export async function pruneMuseQuota(db,{now=Date.now(),windowSeconds=60,retentionWindows=1440}={}){
 if(!db?.prepare||!Number.isFinite(now)||!Number.isInteger(retentionWindows)||retentionWindows<2)throw Error("invalid_cleanup");
 const oldest=Math.floor(now/(windowSeconds*1000))-retentionWindows;
 const result=await db.prepare('DELETE FROM "MuseRequestQuota" WHERE "windowId"<?').bind(oldest).run();
 return Number(result?.meta?.changes||0);
}
