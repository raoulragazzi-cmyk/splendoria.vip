import {checkMuseWriteQuota} from "./musa-interview-quota.js";
import {resolveMuseOwner} from "./musa-interview-auth.js";
import {createMuseSession,listMuseTurns} from "./musa-interview-store.js";
import {appendMuseTurnAtomic} from "./musa-interview-atomic.js";
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const fail=(code,status)=>respond({error:code},status);
export async function handleMuseInterviewApi(request,env) {
 const url=new URL(request.url);
 const match=url.pathname.match(/^\/api\/musa\/libro\/([A-Za-z0-9_-]{1,128})(?:\/sessioni(?:\/([A-Za-z0-9-]{1,128})(?:\/turni)?)?)?$/);
 if(!match)return null;
 // Separate opt-in flag: never enabled on production, even if a route is guessed.
 if(env?.ENVIRONMENT!=="staging" || env?.MUSA_INTERVIEW_API_ENABLED!=="true")return fail("not_found",404);
 const origin=request.headers.get("origin");
 if(origin && origin!==url.origin)return fail("origin_forbidden",403);
 const site=request.headers.get("sec-fetch-site");
 if(site && !["same-origin","none"].includes(site))return fail("cross_site_forbidden",403);
 const [_,projectId,sessionId]=match;
 const isTurn=url.pathname.endsWith("/turni");
 const method=request.method;
 if(!((method==="POST"&&!sessionId)||(method==="GET"&&!!sessionId&&!isTurn)||(method==="POST"&&!!sessionId&&isTurn)))return fail("method_not_allowed",405);
 if(method==="POST" && (!origin || origin!==url.origin))return fail("origin_required",403);
 const owner=await resolveMuseOwner(request,env.DB,projectId);
 if(!owner)return fail("not_found",404);
 if(method==="POST") { try { if(!await checkMuseWriteQuota(env.DB,owner.userId))return fail("rate_limited",429); } catch {return fail("quota_unavailable",503);} }
 try{
  if(method==="GET")return respond(await listMuseTurns(env.DB,sessionId,owner));
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return fail("json_required",415);
  const raw=await request.text();
  if(raw.length>12000)return fail("payload_too_large",413);
  let body;try{body=JSON.parse(raw)}catch{return fail("invalid_json",400)}
  if(!body || typeof body!=="object" || Array.isArray(body))return fail("invalid_body",400);
  if(isTurn){
   const saved=await appendMuseTurnAtomic(env.DB,sessionId,owner,{expectedVersion:body.expectedVersion,content:body.content});
   return respond(saved,201);
  }
  return respond(await createMuseSession(env.DB,{locale:body.locale,track:body.track},owner),201);
 }catch(e){
  if(["invalid_input","invalid_turn","unsupported_locale","unsupported_track","invalid_turns"].includes(e.message))return fail("invalid_input",400);
  if(e.message==="not_found"||e.message==="access_denied")return fail("not_found",404);
  if(["not_saved","save_conflict"].includes(e.message))return fail("save_conflict",409);
  return fail("server_error",500);
 }
}
