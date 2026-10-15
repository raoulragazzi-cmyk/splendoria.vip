/**
 * Read-only Splendoria session adapter for Musa.
 * Shares the existing spl_session cookie and Session/User database tables.
 * This module does NOT create sessions or accept caller-supplied user IDs.
 */
const hex = bytes => Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,"0")).join("");
export async function resolveMuseOwner(request, db, projectId) {
 if (!request || !db?.prepare || typeof projectId!=="string" || !/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) return null;
 const header=request.headers?.get("cookie")||"";
 const pair=header.split(";").map(v=>v.trim()).find(v=>v.startsWith("spl_session="));
 if (!pair) return null;
 const raw=pair.slice("spl_session=".length);
 if (!raw || raw.length>512) return null;
 const hash=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw)));
 const user=await db.prepare('SELECT u."id" FROM "Session" s JOIN "User" u ON u."id"=s."userId" WHERE s."tokenHash"=? AND s."expiresAt">?')
  .bind(hash,new Date().toISOString()).first();
 if (!user?.id) return null;
 const book=await db.prepare('SELECT "id" FROM "BookProject" WHERE "id"=? AND "userId"=?')
  .bind(projectId,user.id).first();
 if (!book?.id) return null;
 return Object.freeze({authorized:true,userId:user.id,projectId:book.id});
}
