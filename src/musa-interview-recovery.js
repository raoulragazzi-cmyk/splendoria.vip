/**
 * Client-side recovery helper: never blindly retry a write after a timeout.
 * Reconcile by fetching canonical server state, then let the author decide.
 */
export async function submitMuseTurnSafely({fetcher=fetch,baseUrl,sessionId,expectedVersion,content,origin}){
 if(typeof baseUrl!=="string"||!baseUrl.startsWith("/")||!/^[-a-zA-Z0-9]{1,128}$/.test(sessionId)||!Number.isSafeInteger(expectedVersion)||expectedVersion<0||typeof content!=="string"||!content.trim())throw Error("invalid_submission");
 const path=baseUrl.replace(/\/$/,"")+"/"+encodeURIComponent(sessionId);
 let response;
 try {
  response=await fetcher(path+"/turni",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",...(origin?{"Origin":origin}:{})},body:JSON.stringify({expectedVersion,content})});
  if(response.ok)return {status:"saved",data:await response.json()};
  if(response.status!==409) return {status:"failed",httpStatus:response.status};
 }catch {
  // Unknown outcome: response may have been lost AFTER D1 committed.
 }
 try {
  const state=await fetcher(path,{method:"GET",credentials:"same-origin"});
  if(!state.ok)return {status:"unconfirmed",httpStatus:state.status};
  return {status:"reconcile",data:await state.json()};
 }catch {
  return {status:"unconfirmed"};
 }
}
