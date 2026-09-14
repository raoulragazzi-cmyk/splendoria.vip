import { localizeEditorResidualHtml, localizeStudioRuntimeScript } from "../src/i18n-editor-copy-worker.js";

const authoredTrap = "Ti guida con 7 domande calibrate sulle pagine mancanti. Richiede sblocco. Premi e inizia a parlare.";
const html = `<!doctype html><html lang="de"><body>
<details class="onboarding-card" open><summary><span><span class="eyebrow">Percorso guidato</span><strong>2 di 5 passi completati</strong></span></summary><ol>
<li><a href="#source">Affida i ricordi reali</a><p>312 parole raccolte · obiettivo iniziale almeno 260</p></li>
<li><a href="#muse">Completa l’intervista narrativa</a><p>95 parole nelle risposte</p></li>
<li><a href="#muse">Disegna l’indice del libro</a><p>12 capitoli creati</p></li>
<li><a href="#chapter">Scrivi e controlla il primo capitolo</a><p>640 parole nel primo capitolo</p></li>
<li><a href="#chapter">Esegui la revisione finale</a><p>Usa “Correggi grammatica”, poi apri l’anteprima</p></li>
</ol><p class="onboarding-help"><a href="/de/guida">Apri la guida completa</a> se vuoi vedere istruzioni, esempi e soluzioni ai problemi più comuni.</p></details>
<form class="spl-restore-book"><span class="small muted">Backup del 14/9/2026, 10:30:45</span></form>
<section class="book-progress-card"><h2>1.240 parole · 4,2 di 84 pagine stimate</h2><p>12 Kapitel · etwa 7 Seiten je Kapitel. Restano circa 79,8 pagine da completare.</p></section>
<div class="source-material-panel"><p class="muted">Inserisci qui la maggiore quantità possibile di materiale concreto: date, luoghi, nomi e ruoli dei personaggi, relazioni, eventi, parole ricordate, conseguenze e ogni altro dettaglio reale. Più elementi fornisci, più la Musa potrà comporre un testo preciso, ricco e fedele alla tua voce.</p></div>
<textarea id="story">${authoredTrap}</textarea>
<input name="title" value="${authoredTrap}">
<h1>${authoredTrap}</h1><h3>${authoredTrap}</h3><h4>${authoredTrap}</h4>
<div class="live-page-copy"><p>${authoredTrap}</p></div>
<label class="field">I protagonisti<textarea placeholder="Chi non può mancare?">Anna</textarea></label>
<span class="small muted">Premi e inizia a parlare</span>
<aside class="muse"><ul class="muse-list"><li><span aria-hidden="true">01</span>Ti guida con 7 domande calibrate sulle pagine mancanti</li><li><span aria-hidden="true">02</span>Calcola parole e pagine per capitolo e per il libro</li><li><span aria-hidden="true">03</span>Non aggiunge fatti, ripetizioni o testo riempitivo</li></ul></aside>
<span class="wordcount" data-count-for="story">312 parole</span>
<span class="wordcount" data-count-for="chapter" data-show-pages>640 parole · 2,3 pagine stimate</span>
<article class="card chapter-lock-card"><p class="kicker">Capitolo 2 · bloccato</p><p>Questo capitolo sarà disponibile quando Splendoria avrà impostato il libro come “Pagato” o “Gratuito”.</p><span class="badge">Richiede sblocco</span></article>
<label>Password attuale<input name="password"></label><label>Scrivi ELIMINA per confermare<input name="confirmation" pattern="ELIMINA"></label>
</body></html>`;

const expected = {
  de: ["Geführter Weg", "2 von 5 Schritten abgeschlossen", "Vertraue uns deine echten Erinnerungen an", "312 Wörter gesammelt", "Sicherung vom 14.09.2026, 10:30:45", "1.240 Wörter", "Noch etwa 79,8 Seiten", "Wer darf keinesfalls fehlen?", "Drücke und beginne zu sprechen", "Sie führt dich mit 7", "640 Wörter · 2,3 geschätzte Seiten", "Kapitel 2 · gesperrt", "Freischaltung erforderlich", "Aktuelles Passwort"],
  en: ["Guided path", "2 of 5 steps completed", "Entrust your real memories", "312 words collected", "Backup from 14/09/2026, 10:30:45", "1.240 words", "About 79,8 pages", "Who must be part of the story?", "Press and start speaking", "It guides you with 7", "640 words · 2,3 estimated pages", "Chapter 2 · locked", "Unlock required", "Current password"]
};

for (const locale of ["de", "en"]) {
  const output = localizeEditorResidualHtml(html, locale);
  for (const marker of expected[locale]) if (!output.includes(marker)) throw new Error(`${locale}: missing translated editor marker: ${marker}`);
  const authoredOccurrences = output.split(authoredTrap).length - 1;
  if (authoredOccurrences !== 6) throw new Error(`${locale}: authored content changed; expected 6 preserved occurrences, got ${authoredOccurrences}`);
  if (!output.includes('pattern="ELIMINA"') || !output.includes('Scrivi ELIMINA per confermare')) throw new Error(`${locale}: machine confirmation token ELIMINA changed`);
  if (output.includes("<span class=\"badge\">Richiede sblocco</span>")) throw new Error(`${locale}: lock badge left in Italian`);
}

const runtime = "output.textContent = words + ' parole' + (output.hasAttribute('data-show-pages') ? ' · ' + pages.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' pagine stimate' : '');";
const deScript = localizeStudioRuntimeScript(runtime, "de");
const enScript = localizeStudioRuntimeScript(runtime, "en");
if (!deScript.includes("words + ' Wörter'") || !deScript.includes("toLocaleString('de-DE'") || !deScript.includes("geschätzte Seiten")) throw new Error("de: runtime word/page counter not localized");
if (!enScript.includes("words + ' words'") || !enScript.includes("toLocaleString('en-GB'") || !enScript.includes("estimated pages")) throw new Error("en: runtime word/page counter not localized");

console.log("editor residual i18n: onboarding, progress, copy, word counters and authored-content safety DE/EN verified");
