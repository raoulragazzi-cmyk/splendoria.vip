import {listMuseTurns} from "./musa-interview-store.js";
import {proposeMuseQuestion} from "./musa-interview-ai.js";

/**
 * Produce the next question using previously persisted turns, scoped to the
 * authenticated book owner. Never writes AI output to the database.
 * AI invocation requires explicit consent and a separately enabled feature flag.
 */
export async function getMuseNextQuestion(db,ai,sessionId,owner,{consented=false,aiEnabled=false}={}) {
 const {session,turns}=await listMuseTurns(db,sessionId,owner);
 if(session.status!=="active")throw new Error("session_inactive");
 const context={locale:session.locale,track:session.track,
  turns:turns.map(t=>({role:t.role,content:t.content}))};
 // If consent is absent, do not send autobiographical material to a model.
 const binding=consented && aiEnabled ? ai : null;
 const result=await proposeMuseQuestion(binding,context);
 return {question:result.question,kind:result.kind,source:result.source,
  sessionId:session.id,turnCount:turns.length};
}
