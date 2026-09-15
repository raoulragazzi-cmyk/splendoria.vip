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
assert.match(deHtml, /<textarea>Il tuo posto nella storia\. 100 parole\.<\/textarea>/, 'German pass must preserve textarea author content');
assert.match(deHtml, /<input value="La storia si sta facendo più nitida\.">/, 'German pass must preserve authored input values');
assert.match(deHtml, /<div class="live-page-copy">Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui\.<\/div>/, 'German pass must preserve preview author content');

const enHtml = localizeDeepStudioHtml(html, 'en');
assert.match(enHtml, /Your place in the story/);
assert.match(enHtml, /Pick up where you left off/);
assert.match(enHtml, /1193 words · 3,4 estimated pages/);
assert.match(enHtml, /Target: about 6,8 pages · 2392 words/);
assert.match(enHtml, /Your story is coming into sharper focus/);
assert.match(enHtml, /You’re writing here/);
assert.match(enHtml, /Chapter title • you can rename it at any time/);
assert.match(enHtml, /<textarea>Il tuo posto nella storia\. 100 parole\.<\/textarea>/, 'English pass must preserve textarea author content');
assert.match(enHtml, /<input value="La storia si sta facendo più nitida\.">/, 'English pass must preserve authored input values');
assert.match(enHtml, /<div class="live-page-copy">Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui\.<\/div>/, 'English pass must preserve preview author content');

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
assert.match(deScript, /Bevor du die Muse einsetzt/);
assert.match(deScript, /1\. Einstieg/);
assert.match(deScript, /Diesen Abschnitt der Muse anvertrauen/);
assert.match(deScript, /Wörter geschrieben/);
assert.match(deScript, /Ich sichere deine Worte/);
assert.match(deScript, /\(\?:parole\|Wörter\)/, 'German runtime target parser must accept localized word label');
assert.match(deScript, /\(\?:de\|en\)/, 'German localized editor route must still resolve the book id');

const enScript = localizeDeepStudioScript(script, 'en');
assert.match(enScript, /Back to the top of the page/);
assert.match(enScript, /Back to top/);
assert.match(enScript, /Childhood/);
assert.match(enScript, /Before using the Muse/);
assert.match(enScript, /1\. Opening/);
assert.match(enScript, /Entrust this section to the Muse/);
assert.match(enScript, /words written/);
assert.match(enScript, /Safeguarding your words/);
assert.match(enScript, /\(\?:parole\|words\)/, 'English runtime target parser must accept localized word label');
assert.match(enScript, /\(\?:de\|en\)/, 'English localized editor route must still resolve the book id');

const userText = 'Mia madre diceva: «scrivevo in italiano», ma vivevamo a Köln.';
const germanOptions = {
  messages: [
    { role: 'system', content: "LINGUA DELL'OPERA: TEDESCO. Scrivi il capitolo senza inventare fatti." },
    { role: 'user', content: userText }
  ],
  temperature: 0.2
};
const strengthenedGerman = strengthenMuseOptions(germanOptions);
assert.notStrictEqual(strengthenedGerman, germanOptions);
assert.match(strengthenedGerman.messages[0].content, /VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE/);
assert.match(strengthenedGerman.messages[0].content, /Standarddeutsch/);
assert.equal(strengthenedGerman.messages[1].content, userText, 'German brain pass must preserve user-authored content byte-identically');
assert.equal(strengthenedGerman.temperature, 0.2);

const englishOptions = {
  messages: [
    { role: 'system', content: "LINGUA DELL'OPERA: INGLESE BRITANNICO. Scrivi il capitolo senza inventare fatti." },
    { role: 'user', content: userText }
  ],
  temperature: 0.25
};
const strengthenedEnglish = strengthenMuseOptions(englishOptions);
assert.notStrictEqual(strengthenedEnglish, englishOptions);
assert.match(strengthenedEnglish.messages[0].content, /MANDATORY LANGUAGE CONTRACT FOR THE MUSE/);
assert.match(strengthenedEnglish.messages[0].content, /British English/);
assert.equal(strengthenedEnglish.messages[1].content, userText, 'English brain pass must preserve user-authored content byte-identically');
assert.equal(strengthenedEnglish.temperature, 0.25);

const italian = { messages: [{ role: 'system', content: 'Scrivi in italiano.' }] };
assert.strictEqual(strengthenMuseOptions(italian), italian, 'Italian Muse path must remain untouched');

console.log('studio deep i18n DE/EN smoke: ok');
