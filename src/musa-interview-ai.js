import {buildMuseInterviewInstructions,nextInterviewStep,validateInterviewInput} from "./musa-interview-policy.js";

// Deliberately an isolated service: no outbound call is made unless the caller
// explicitly invokes it with a configured AI binding after author consent.
export async function proposeMuseQuestion(ai,input,{model="@cf/meta/llama-3.3-70b-instruct-fp8-fast"}={}){
 const context=validateInterviewInput(input);
 const fallback=nextInterviewStep(context);
 if(fallback.kind==="review") return {...fallback,source:"policy"};
 if(!context.turns.some(t=>t.role==="author"))return {...fallback,source:"policy"};
 if(!ai?.run)return {...fallback,source:"fallback"};
 const turns=context.turns.slice(-8).map(t=>({role:t.role,content:t.content.slice(0,2000)}));
 const payload={
  messages:[
   {role:"system",content:buildMuseInterviewInstructions(context.locale)+"\nOutput only one short question, no preface, no markdown."},
   {role:"user",content:JSON.stringify({track:context.track,turns})}
  ],
  max_tokens:160,temperature:0.35
 };
 try {
  const result=await ai.run(model,payload);
  const text=String(result?.response||result?.result?.response||"").trim();
  // Reject malformed content instead of persisting a hallucinated passage.
  if(!text || text.length>350 || text.includes("\n") || /<[^>]+>|https?:\/\//i.test(text) || !/[?？]$/.test(text))
    return {...fallback,source:"fallback"};
  return {kind:"question",question:text,source:"ai"};
 } catch {
  return {...fallback,source:"fallback"};
 }
}
