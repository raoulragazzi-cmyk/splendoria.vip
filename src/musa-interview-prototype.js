/**
 * Non-persistent demo of the Musa interview flow.
 * Staging-only routing is enforced by the importing worker.
 * Do not use with actual client material: nothing here is saved.
 */
import { nextInterviewStep, TRACKS, LOCALES } from "./musa-interview-policy.js";
const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const copy = {
 it: {title:"Musa — intervista narrativa", notice:"PROTOTIPO STAGING · Nessuna risposta viene salvata. Non inserire dati personali reali.",select:"Quale storia vuoi raccontare?",send:"Rispondi",skip:"Salta",pause:"Ricomincia",placeholder:"Scrivi qui il tuo ricordo…", label:"La tua risposta",tracks:["La mia vita","La mia famiglia","La mia impresa","Un momento decisivo"],refusal:"Preferisco non parlarne",initial:"Inizia l'intervista"},
 de: {title:"Muse — erzählendes Interview",notice:"STAGING-PROTOTYP · Antworten werden nicht gespeichert. Keine echten personenbezogenen Daten eingeben.",select:"Welche Geschichte möchtest du erzählen?",send:"Antworten",skip:"Überspringen",pause:"Neu beginnen",placeholder:"Schreibe hier deine Erinnerung…",label:"Deine Antwort",tracks:["Mein Leben","Meine Familie","Mein Unternehmen","Ein Wendepunkt"],refusal:"Darüber möchte ich nicht sprechen",initial:"Interview beginnen"},
 en: {title:"Muse — narrative interview",notice:"STAGING PROTOTYPE · Answers are not saved. Do not enter real personal information.",select:"What story would you like to tell?",send:"Reply",skip:"Skip",pause:"Start again",placeholder:"Write your memory here…",label:"Your answer",tracks:["My life","My family","My business","A turning point"],refusal:"I would rather not discuss this",initial:"Start interview"}
};
export function renderMusaInterviewPrototype(locale = "it") {
 if (!LOCALES.includes(locale)) throw new RangeError("unsupported_locale");
 const c = copy[locale];
 const first = nextInterviewStep({locale,track:"life"});
 const options = TRACKS.map((track,i)=>`<option value="${track}">${esc(c.tracks[i])}</option>`).join("");
 // The prototype is deliberately client-only, no audio recording or network submissions.
 return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(c.title)}</title><style>
 :root{font-family:system-ui,-apple-system,sans-serif;background:#f7f8f5;color:#123c33}*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:760px;margin:5vh auto;padding:clamp(24px,5vw,54px);background:white;border-radius:24px;border:1px solid #d8e1dc;box-shadow:0 18px 50px #0d362012}h1{font-family:Georgia,serif;font-size:clamp(30px,5vw,48px)}.notice{padding:12px 16px;background:#fff5dd;border-radius:10px;font-size:14px}.question{padding:24px;background:#f1f7f3;border-left:4px solid #137765;border-radius:10px;font-size:22px;line-height:1.5}label{display:block;margin:20px 0 10px;font-weight:700}textarea,select{width:100%;border:1px solid #a9bdb5;border-radius:9px;font:inherit;padding:14px}textarea{min-height:130px}button{min-height:44px;padding:12px 18px;border-radius:9px;border:1px solid #246859;background:#246859;color:white;font-weight:600;cursor:pointer}button.secondary{background:white;color:#246859}button:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #c9a04b;outline-offset:3px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.history{margin-top:20px;overflow-wrap:anywhere}.entry{border-bottom:1px solid #e3eae6;padding:10px 0}.entry b{display:block}
 </style></head><body><main><h1>${esc(c.title)}</h1><p class="notice" role="note">${esc(c.notice)}</p><label for="track">${esc(c.select)}</label><select id="track">${options}</select><div id="question" role="status" aria-live="polite" class="question">${esc(first.question)}</div><label for="answer">${esc(c.label)}</label><textarea id="answer" maxlength="10000" placeholder="${esc(c.placeholder)}"></textarea><div class="actions"><button id="send" type="button">${esc(c.send)}</button><button id="skip" class="secondary" type="button">${esc(c.skip)}</button><button id="refuse" class="secondary" type="button">${esc(c.refusal)}</button><button id="restart" class="secondary" type="button">${esc(c.pause)}</button></div><section class="history" id="history" aria-live="polite"></section></main><script>
 (()=>{
 const language=${JSON.stringify(locale)},question=document.getElementById("question"),track=document.getElementById("track"),answer=document.getElementById("answer"),history=document.getElementById("history");let count=0;
 const initial=${JSON.stringify(copy[locale].initial)},followup=${JSON.stringify(copy[locale].refusal)};
 const questions=${JSON.stringify({
   life:nextInterviewStep({locale,track:"life"}).question,
   family:nextInterviewStep({locale,track:"family"}).question,
   enterprise:nextInterviewStep({locale,track:"enterprise"}).question,
   turning_point:nextInterviewStep({locale,track:"turning_point"}).question
 })};
 const next=${JSON.stringify({it:["Quale dettaglio vuoi aggiungere?","C'è un altro ricordo da condividere?","Rivediamo i ricordi prima di continuare."],de:["Welches Detail möchtest du ergänzen?","Gibt es noch eine Erinnerung?","Gehen wir deine Erinnerungen gemeinsam durch."],en:["What detail would you like to add?","Is there another memory to share?","Let's review your memories before continuing."]}[locale])};
 function reset(){count=0;history.replaceChildren();answer.value="";question.textContent=questions[track.value];answer.focus()}
 function advance(value){if(value){let item=document.createElement("p");item.className="entry";item.textContent=value;history.append(item)}count++;question.textContent=count%6===0?next[2]:count%2===1?next[0]:next[1];answer.value="";answer.focus()}
 track.addEventListener("change",reset);
 document.getElementById("send").addEventListener("click",()=>{const text=answer.value.trim();if(text)advance(text)});
 document.getElementById("skip").addEventListener("click",()=>advance(""));
 document.getElementById("refuse").addEventListener("click",()=>advance(followup));
 document.getElementById("restart").addEventListener("click",reset);
 })();
 </script></body></html>`;
}
