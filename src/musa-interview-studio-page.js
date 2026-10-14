/**
 * Staging-only authenticated author interview UI.
 * Separate external client script works with a strict content security policy.
 */
const COPY = {
 it: {
  title:"La Musa ti intervista",intro:"Racconta la tua storia, un ricordo alla volta. Puoi mettere in pausa e riprendere quando vuoi.",
  labelTrack:"Da dove vuoi cominciare?",life:"La mia vita",family:"La mia famiglia",enterprise:"La mia impresa",turning_point:"Un momento decisivo",
  start:"Inizia una nuova intervista",previous:"Riprendi un'intervista",choose:"Seleziona una sessione",answer:"Il tuo ricordo",send:"Salva la risposta",
  pause:"Metti in pausa",resume:"Riprendi",complete:"Concludi l'intervista",confirm:"Vuoi davvero concludere questa intervista?",
  consent:"Autorizzo l'elaborazione dei ricordi di questa intervista da parte della Musa AI per formulare domande personalizzate. Posso revocare questa scelta in qualsiasi momento.",
  saveConsent:"Salva la scelta AI",privacy:"Informativa privacy",question:"La prossima domanda della Musa",
  history:"I miei ricordi salvati",waiting:"Scegli un'intervista per iniziare.",busy:"Attendi: sto salvando...",error:"Operazione non riuscita. I ricordi già salvati restano disponibili.",uncertain:"Connessione interrotta: ho riletto lo stato sul server. Controlla la cronologia prima di inviare nuovamente.",
  saved:"Risposta salvata.",started:"Intervista avviata.",updated:"Intervista aggiornata.",consented:"Preferenza AI salvata.", noQuestion:"Domanda temporaneamente non disponibile: puoi riprovare.",
  statusActive:"Attiva",statusPaused:"In pausa",statusCompleted:"Conclusa",author:"Tu",muse:"Musa"
 },
 de: {
  title:"Die Muse interviewt dich",intro:"Erzähle deine Geschichte, Erinnerung für Erinnerung. Du kannst jederzeit pausieren und fortfahren.",
  labelTrack:"Wo möchtest du beginnen?",life:"Mein Leben",family:"Meine Familie",enterprise:"Mein Unternehmen",turning_point:"Ein Wendepunkt",
  start:"Neues Interview beginnen",previous:"Interview fortsetzen",choose:"Sitzung auswählen",answer:"Deine Erinnerung",send:"Antwort speichern",
  pause:"Pausieren",resume:"Fortsetzen",complete:"Interview abschließen",confirm:"Möchtest du dieses Interview wirklich abschließen?",
  consent:"Ich stimme zu, dass die Muse KI meine Erinnerungen aus diesem Interview verwendet, um persönliche Fragen zu stellen. Ich kann diese Einwilligung jederzeit widerrufen.",
  saveConsent:"KI-Auswahl speichern",privacy:"Datenschutzerklärung",question:"Nächste Frage der Muse",
  history:"Gespeicherte Erinnerungen",waiting:"Wähle ein Interview aus.",busy:"Bitte warten: Speichervorgang läuft...",error:"Vorgang fehlgeschlagen. Bereits gespeicherte Erinnerungen bleiben erhalten.",uncertain:"Verbindung unterbrochen: Der Serverstatus wurde erneut geladen. Bitte überprüfe deine Erinnerungen vor einem erneuten Versand.",
  saved:"Antwort gespeichert.",started:"Interview gestartet.",updated:"Interview aktualisiert.",consented:"KI-Einwilligung gespeichert.",noQuestion:"Frage ist vorübergehend nicht verfügbar.",
  statusActive:"Aktiv",statusPaused:"Pausiert",statusCompleted:"Abgeschlossen",author:"Du",muse:"Muse"
 },
 en: {
  title:"The Muse interviews you",intro:"Tell your story one memory at a time. You can pause and return whenever you like.",
  labelTrack:"Where would you like to begin?",life:"My life",family:"My family",enterprise:"My business",turning_point:"A turning point",
  start:"Start a new interview",previous:"Continue an interview",choose:"Choose a session",answer:"Your memory",send:"Save my answer",
  pause:"Pause",resume:"Resume",complete:"Finish interview",confirm:"Do you want to finish this interview?",
  consent:"I agree that the AI Muse may process memories from this interview to ask personalized questions. I may withdraw consent at any time.",
  saveConsent:"Save AI preference",privacy:"Privacy notice",question:"The Muse's next question",
  history:"My saved memories",waiting:"Choose an interview to begin.",busy:"Please wait: saving...",error:"The operation failed. Previously saved memories remain available.",uncertain:"Connection interrupted: server state has been reloaded. Check the saved memories before submitting again.",
  saved:"Answer saved.",started:"Interview started.",updated:"Interview updated.",consented:"AI preference saved.",noQuestion:"Question temporarily unavailable. Try again.",
  statusActive:"Active",statusPaused:"Paused",statusCompleted:"Completed",author:"You",muse:"Muse"
 }
};
const escape = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function renderMuseInterviewStudioPage(bookId,language="it"){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(bookId))throw Error("invalid_book");
 const lang=Object.hasOwn(COPY,language)?language:"it", c=COPY[lang];
 const options=["life","family","enterprise","turning_point"].map(v=>'<option value="'+v+'">'+escape(c[v])+'</option>').join("");
 const back="/libro/"+encodeURIComponent(bookId);
 return \`<!doctype html><html lang="\${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="robots" content="noindex,nofollow"><title>\${escape(c.title)} — Splendoria</title>
 <style>
 :root{font:16px/1.5 system-ui,-apple-system,sans-serif;color:#173c35;background:#f6f8f5;--green:#176a59;--gold:#c29a5a}
 *{box-sizing:border-box}body{margin:0}header{padding:16px max(20px,calc((100vw - 1020px)/2));background:#173c35;color:#fff}
 header a{color:#fff;text-decoration:none}main{max-width:1020px;margin:30px auto 70px;padding:0 20px}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(32px,4vw,52px);margin:0 0 9px}h2{font-size:24px;margin:0 0 14px}.intro{max-width:690px;color:#4b685e}
 .layout{display:grid;grid-template-columns:minmax(270px,320px) minmax(0,1fr);gap:20px;margin-top:25px}.panel{background:#fff;border:1px solid #d5e2dc;border-radius:18px;padding:22px;box-shadow:0 8px 28px #183f3210}
 label{display:block;font-weight:650;margin:13px 0 7px}select,textarea{width:100%;font:inherit;border:1px solid #a8bdb4;border-radius:10px;padding:10px 12px;background:#fff;color:inherit}
 textarea{min-height:170px;resize:vertical}.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:13px}
 button{min-height:44px;background:var(--green);color:#fff;border:1px solid var(--green);border-radius:10px;padding:10px 13px;font:600 14px system-ui;cursor:pointer}
 button.secondary{background:white;color:var(--green)}button:disabled{opacity:.5;cursor:default}
 :focus-visible{outline:3px solid var(--gold);outline-offset:3px}
 .consent{border:1px solid #d5e2dc;border-radius:12px;padding:14px;margin-top:18px;background:#f7faf8}
 .consent label{display:flex;gap:12px;align-items:start;font-weight:400}.consent input{margin-top:5px;transform:scale(1.2)}
 .question{padding:18px;border-left:4px solid var(--gold);background:#f8f7f0;border-radius:9px;font:22px/1.5 Georgia,serif;min-height:95px;white-space:pre-wrap}
 .transcript{margin-top:20px;display:grid;gap:10px;max-height:420px;overflow:auto}.memory{border-radius:12px;padding:12px 16px;background:#edf5f0;overflow-wrap:anywhere;white-space:pre-wrap}
 .memory strong{display:block;font-size:13px;padding-bottom:5px}#status{min-height:27px;font-size:14px;font-weight:600;color:#365d52}
 .small{font-size:13px;color:#5a7268;margin-top:12px}a{color:var(--green)}
 @media(max-width:730px){.layout{grid-template-columns:1fr}main{margin-top:20px}.panel{padding:17px}}
 @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
 </style></head>
 <body data-book="\${escape(bookId)}"><header><a href="\${back}">← Splendoria Studio</a></header>
 <main><h1>\${escape(c.title)}</h1><p class="intro">\${escape(c.intro)}</p>
 <div class="layout"><aside class="panel">
 <label for="track">\${escape(c.labelTrack)}</label><select id="track">\${options}</select>
 <div class="actions"><button type="button" id="start">\${escape(c.start)}</button></div>
 <label for="sessions">\${escape(c.previous)}</label><select id="sessions"><option value="">\${escape(c.choose)}</option></select>
 <div class="actions"><button type="button" id="pause" class="secondary" disabled>\${escape(c.pause)}</button><button type="button" id="resume" class="secondary" disabled>\${escape(c.resume)}</button>
 <button type="button" id="complete" class="secondary" disabled>\${escape(c.complete)}</button></div>
 <div class="consent"><label for="consent"><input type="checkbox" id="consent" disabled><span>\${escape(c.consent)}</span></label>
 <button type="button" id="save-consent" class="secondary" disabled>\${escape(c.saveConsent)}</button>
 <p class="small"><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">\${escape(c.privacy)}</a></p></div>
 </aside><section class="panel"><p id="status" role="status" aria-live="polite">\${escape(c.waiting)}</p>
 <h2>\${escape(c.question)}</h2><div id="question" class="question" aria-live="polite"></div>
 <label for="answer">\${escape(c.answer)}</label><textarea id="answer" maxlength="10000" disabled></textarea>
 <div class="actions"><button type="button" id="send" disabled>\${escape(c.send)}</button></div>
 <h2 style="margin-top:28px">\${escape(c.history)}</h2><div id="transcript" class="transcript" role="log" aria-live="polite"></div>
 </section></div></main><script defer src="/musa-intervista/app.js"></script></body></html>\`;
}
export const MUSA_STUDIO_CLIENT_JS = String.raw\`
(()=>{"use strict";
 const el=id=>document.getElementById(id);
 const lang=document.documentElement.lang||"it";
 const txt=\${JSON.stringify(COPY)};
 const c=txt[lang]||txt.it, book=document.body.dataset.book;
 const base="/api/musa/libro/"+encodeURIComponent(book)+"/sessioni";
 let current=null,version=0,status="",busy=false;
 const setStatus=(message)=>{el("status").textContent=message;};
 const lock=(state)=>{
  busy=state;
  const active=Boolean(current&&status==="active");
  const paused=Boolean(current&&status==="paused");
  for(const id of ["start","sessions","track"])el(id).disabled=state;
  el("answer").disabled=state||!active;
  el("send").disabled=state||!active;
  el("pause").disabled=state||!active;
  el("resume").disabled=state||!paused;
  el("complete").disabled=state||!active;
  el("consent").disabled=state||!current;
  el("save-consent").disabled=state||!current;
 };
 const request=async(method,url,body)=>{
  const opts={method,credentials:"same-origin",headers:{"Accept":"application/json"}};
  if(method==="POST"){opts.headers["Content-Type"]="application/json";opts.body=JSON.stringify(body||{});}
  const r=await fetch(url,opts);
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||String(r.status));
  return data;
 };
 const renderTurns=turns=>{
  el("transcript").replaceChildren();
  for(const turn of turns){
   if(turn.role!=="author")continue;
   const item=document.createElement("div");item.className="memory";
   const who=document.createElement("strong");who.textContent=c.author+" · "+turn.ordinal;
   const text=document.createElement("div");text.textContent=turn.content;
   item.append(who,text);el("transcript").append(item);
  }
 };
 async function refreshSessions(){
  const data=await request("GET",base);
  const select=el("sessions"),chosen=select.value;select.replaceChildren();
  const blank=document.createElement("option");blank.value="";blank.textContent=c.choose;select.append(blank);
  for(const s of data.sessions||[]){
   const opt=document.createElement("option");opt.value=s.id;
   opt.textContent=(c[s.track]||s.track)+" · "+(c["status"+s.status[0].toUpperCase()+s.status.slice(1)]||s.status)+" · "+(s.updatedAt||"");
   select.append(opt);
  }
  if(chosen && Array.from(select.options).some(x=>x.value===chosen))select.value=chosen;
  return data.sessions||[];
 }
 async function ask(){
  if(!current||status!=="active")return;
  el("question").textContent="…";
  try{
   const data=await request("POST",base+"/"+encodeURIComponent(current)+"/prossima",{});
   el("question").textContent=data.question||c.noQuestion;
  }catch{el("question").textContent=c.noQuestion;}
 }
 async function open(sid){
  if(!sid)return;
  lock(true);
  try{
   const state=await request("GET",base+"/"+encodeURIComponent(sid));
   current=sid;version=state.session.version;status=state.session.status;
   renderTurns(state.turns||[]);
   const agreement=await request("GET",base+"/"+encodeURIComponent(sid)+"/consenso");
   el("consent").checked=Boolean(agreement.consented);
   el("sessions").value=sid;
   el("question").textContent=status==="active"?"…":(c["status"+status[0].toUpperCase()+status.slice(1)]||status);
   setStatus(c.updated);
  }catch{setStatus(c.error);}
  finally{lock(false);}
  if(status==="active")await ask();
 }
 async function transition(action){
  if(!current||busy)return;
  lock(true);
  try{
   await request("POST",base+"/"+encodeURIComponent(current)+"/stato",{action,expectedVersion:version});
   await open(current);
  }catch{setStatus(c.error);await open(current).catch(()=>{});}
  finally{lock(false);}
 }
 el("start").addEventListener("click",async()=>{
  if(busy)return;
  lock(true);setStatus(c.busy);
  try{
   const created=await request("POST",base,{locale:lang,track:el("track").value});
   await refreshSessions();
   await open(created.id);
   setStatus(c.started);
  }catch{setStatus(c.error);}
  finally{lock(false);}
 });
 el("sessions").addEventListener("change",()=>{if(el("sessions").value)open(el("sessions").value);});
 el("send").addEventListener("click",async()=>{
  const answer=el("answer").value.trim();
  if(!answer||!current||busy||status!=="active")return;
  lock(true);setStatus(c.busy);
  try{
   await request("POST",base+"/"+encodeURIComponent(current)+"/turni",{expectedVersion:version,content:answer});
   el("answer").value="";
   await open(current);
   setStatus(c.saved);
  }catch{
   // A network timeout may occur after D1 commits: NEVER retry a write blindly.
   await open(current).catch(()=>{});
   setStatus(c.uncertain);
  }finally{lock(false);}
 });
 el("pause").addEventListener("click",()=>transition("pause"));
 el("resume").addEventListener("click",()=>transition("resume"));
 el("complete").addEventListener("click",()=>{if(window.confirm(c.confirm))transition("complete");});
 el("save-consent").addEventListener("click",async()=>{
  if(!current||busy)return;
  lock(true);
  try{
   await request("POST",base+"/"+encodeURIComponent(current)+"/consenso",{grant:el("consent").checked});
   setStatus(c.consented);
   await ask();
  }catch{setStatus(c.error);}
  finally{lock(false);}
 });
 refreshSessions().then(async sessions=>{
  if(sessions.length){await open(sessions[0].id);}
  else{setStatus(c.waiting);lock(false);}
 }).catch(()=>{setStatus(c.error);lock(false);});
})();
\`;
