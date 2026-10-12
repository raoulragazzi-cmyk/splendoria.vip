import {resolveMuseOwner} from "./musa-interview-auth.js";
import {changeMuseSessionStatus} from "./musa-interview-state.js";
import {getMuseAiConsent,setMuseAiConsent} from "./musa-interview-consent.js";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
/** Separate narrow router: only session /state and /consenso endpoints. */
export async function handleMuseSessionControls(request,env){
 const url=new URL(request.url);
 const match=url.pathname.match(/^\/api\/musa\/libro\/([A-Za-z0-9_-]{1,128})\/sessioni\/([A-Za-z0-9-]{1,128})\/(stato|consenso)$/);
 if(!match)return null;
 if(env?.ENVIRONMENT!=="staging"||env?.MUSA_INTERVIEW_API_ENABLED!=="true")return json({error:"not_found"},404);
 const [_,projectId,sessionId,action]=match;
 if(!["GET","POST"].includes(request.method)||(action==="stato"&&request.method!=="POST"))return json({error:"method_not_allowed"},405);
 const origin=request.headers.get("origin");
 const site=request.headers.get("sec-fetch-site");
 if(site&&!["same-origin","none"].includes(site))return json({error:"cross_site_forbidden"},403);
 if(origin&&origin!==url.origin)return json({error:"origin_forbidden"},403);
 if(request.method==="POST"&&origin!==url.origin)return json({error:"origin_required"},403);
 const owner=await resolveMuseOwner(request,env.DB,projectId);
 if(!owner)return json({error:"not_found"},404);
 try{
  if(action==="consenso"&&request.method==="GET")return json({consented:await getMuseAiConsent(env.DB,sessionId,owner)});
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return json({error:"json_required"},415);
  const raw=await request.text();
  if(raw.length>1024)return json({error:"payload_too_large"},413);
  let body;try{body=JSON.parse(raw)}catch{return json({error:"invalid_json"},400)}
  if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"invalid_body"},400);
  if(action==="consenso"){
   if(typeof body.grant!=="boolean")return json({error:"invalid_grant"},400);
   return json(await setMuseAiConsent(env.DB,sessionId,owner,body.grant));
  }
  if(!["pause","resume","complete"].includes(body.action)||!Number.isSafeInteger(body.expectedVersion)||body.expectedVersion<0)return json({error:"invalid_state"},400);
  return json(await changeMuseSessionStatus(env.DB,sessionId,owner,body.action,body.expectedVersion));
 }catch(e){
  if(["state_conflict","consent_not_saved"].includes(e.message))return json({error:"state_conflict"},409);
  if(e.message==="access_denied")return json({error:"not_found"},404);
  return json({error:"server_error"},500);
 }
}
