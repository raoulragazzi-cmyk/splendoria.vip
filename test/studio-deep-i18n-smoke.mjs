import assert from 'node:assert/strict';
import {
  localizeDeepStudioHtml,
  localizeDeepStudioScript,
  strengthenMuseOptions
} from '../src/studio-deep-i18n-worker.js';

const html = `
<html><body>
<p class="eyebrow">Il tuo posto nella storia</p>
<p class="muted">Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui.</p>
<p>1193 parole · 3,4 pagine stimate</p>
<p>Obiettivo: circa 6,8 pagine · 2392 parole</p>
<p>La storia si sta facendo più nitida.</p>
<span>Stai scrivendo qui</span>
<label>Titolo del capitolo • puoi rinominarlo in qualsiasi momento</label>
<textarea>Il tuo posto nella storia. 100 parole.</textarea>
<input value="La storia si sta facendo più nitida.">
<div class="live-page-copy">Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui.</div>
</body></html>`;
const deHtml = localizeDeepStudioHtml(html, 'de');
assert.match(deHtml, /Dein Platz in der Geschichte/);
assert.match(deHtml, /Mach dort weiter, wo du aufgehört hast/);
assert.match(deHtml, /1193 Wörter · 3,4 geschätzte Seiten/);
assert.match(deHtml, /Ziel: etwa 6,8 Seiten · 2392 Wörter/);
assert.match(deHtml, /Deine Geschichte gewinnt an Klarheit/);
assert.match(deHtml, /Hier schreibst du gerade/);
assert.match(deHtml, /Kapiteltitel • jederzeit umbenennbar/);
assert.match(deHtml, /<textarea>Il tuo posto nella storia\. 100 parole\.<\/textarea>/, 'textarea author content must remain untouched');
assert.match(deHtml, /<input value="La storia si sta facendo più nitida\.">/, 'input value must remain untouched');
assert.match(deHtml, /<div class="live-page-copy">Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui\.<\/div>/, 'preview author content must remain untouched');
assert.equal(localizeDeepStudioHtml(html, 'en'), html, 'English is intentionally untouched in the German-first phase');

const script = `
backToTop.setAttribute('aria-label', 'Torna all’inizio della pagina');
backToTop.innerHTML = '<b aria-hidden="true">↑</b><span>Torna su</span>';
ideas.innerHTML = '<strong>Se non sai da dove partire, puoi raccontare:</strong>' + ['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato'].map(item => item).join('');
const targetMatch = targetLine.match(/([\\d.\\s]+)\\s*parole/i);
const canonicalMatch = window.location.pathname.match(/^\\/libro\\/([^/]+)/);
readiness.innerHTML = '<strong>Prima di usare la Musa:</strong> servono almeno <b>50 parole di spunto complessive</b> nelle tre sezioni. Non devi scriverne 350: circa 350 è la lunghezza che la Musa può sviluppare per una singola sezione.';
const labels = [ ['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.'], ['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.'], ['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.'] ];
area.placeholder = 'Inizia dalla scena o dal ricordo che apre il capitolo…';
sectionMuse.textContent = 'Affidati alla Musa per questa sezione';
meta.textContent = count + ' parole scritte · Musa: circa ' + sectionTarget;
flash('Metto al sicuro le tue parole…');
`;
const deScript = localizeDeepStudioScript(script, 'de');
assert.match(deScript, /Zum Seitenanfang/);
assert.match(deScript, /Nach oben/);
assert.match(deScript, /Kindheit/);
assert.match(deScript, /Muse bereit|Bevor du die Muse einsetzt/);
assert.match(deScript, /1\. Einstieg/);
assert.match(deScript, /Diesen Abschnitt der Muse anvertrauen/);
assert.match(deScript, /Wörter geschrieben/);
assert.match(deScript, /Ich sichere deine Worte/);
assert.match(deScript, /\(\?:parole\|Wörter\)/, 'runtime target parser must accept localized word label');
assert.match(deScript, /\(\?:de\|en\)/, 'localized editor route must still resolve the book id');
assert.equal(localizeDeepStudioScript(script, 'en'), script, 'English is intentionally untouched in the German-first phase');

const userText = 'Mia madre diceva: «scrivevo in italiano», ma vivevamo a Köln.';
const options = {
  messages: [
    { role: 'system', content: "LINGUA DELL'OPERA: TEDESCO. Scrivi il capitolo senza inventare fatti." },
    { role: 'user', content: userText }
  ],
  temperature: 0.2
};
const strengthened = strengthenMuseOptions(options);
assert.notStrictEqual(strengthened, options);
assert.match(strengthened.messages[0].content, /VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE/);
assert.match(strengthened.messages[0].content, /Standarddeutsch/);
assert.equal(strengthened.messages[1].content, userText, 'user-authored content must remain byte-identical');
assert.equal(strengthened.temperature, 0.2);

const italian = { messages: [{ role: 'system', content: 'Scrivi in italiano.' }] };
assert.strictEqual(strengthenMuseOptions(italian), italian, 'Italian Muse path must remain untouched');

console.log('studio deep i18n German smoke: ok');
