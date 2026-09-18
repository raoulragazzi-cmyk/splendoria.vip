import assert from 'node:assert/strict';
import fs from 'node:fs';
import { localizeDeepStudioScript, strengthenMuseOptions } from '../src/studio-deep-i18n-worker.js';

const source = fs.readFileSync(new URL('../src/studio-worker.js', import.meta.url), 'utf8');
const match = source.match(/const STUDIO_JS_PATCH = String\.raw`([\s\S]*?)`;\n\nfunction patchStudioScript/);
assert.ok(match, 'STUDIO_JS_PATCH must remain extractable for residual scanning');
const patch = match[1];

const visibleItalianMarkers = [
  'Torna all’inizio della pagina',
  '<span>Torna su</span>',
  'Se non sai da dove partire, puoi raccontare:',
  "['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato']",
  '<strong>Prima di usare la Musa:</strong> servono almeno',
  "['1. Introduzione', 'Apri la scena:",
  "['2. Svolgimento', 'Racconta fatti",
  "['3. Chiusura', 'Chiudi il movimento narrativo",
  'Inizia dalla scena o dal ricordo che apre il capitolo…',
  'Sviluppa ciò che accade e ciò che cambia…',
  'Porta il capitolo a una conclusione naturale…',
  'Affidati alla Musa per questa sezione',
  "' parole scritte · Musa: circa '",
  '<strong>Musa pronta:</strong> hai ',
  ' parole di spunto complessive. Circa 350 parole è l’obiettivo di scrittura della Musa',
  '<strong>Prima di usare la Musa:</strong> hai ',
  ' parole di spunto; ne servono almeno <b>50</b> complessive.',
  'Ripristinare l’ultima versione salvata del libro?',
  'Metto al sicuro le tue parole…',
  'Non sono riuscita a salvare in sicurezza ciò che hai scritto.'
];

for (const locale of ['de', 'en']) {
  const localized = localizeDeepStudioScript(patch, locale);
  for (const marker of visibleItalianMarkers) {
    assert.ok(!localized.includes(marker), `${locale}: visible Italian runtime residual: ${marker}`);
  }
  assert.match(localized, /window\.location\.pathname\.match\(\/\^\\\/\(\?:\(\?:de\|en\)\\\/\)\?libro/, `${locale}: localized route-aware book id parser required`);
}


const coreSource = fs.readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
const coreStart = coreSource.indexOf('function studioScript()');
const coreReturn = coreSource.indexOf('return new Response(source', coreStart);
const coreEnd = coreSource.indexOf('\nfunction ', coreReturn);
assert.ok(coreStart >= 0 && coreReturn > coreStart, 'core studioScript must remain extractable');
const coreStudioRuntime = coreSource.slice(coreStart, coreEnd > coreReturn ? coreEnd : undefined);

const lateDynamicItalianMarkers = [
  'La Musa sta rileggendo',
  'La Musa sta scrivendo',
  'Confronta il testo con le tue parole e ne preserva il significato…',
  'Raccoglie le tue parole e le fonti autorizzate…',
  'Controlla grammatica, sintassi e fluidità…',
  'Verifica che fatti, nomi e voce siano rimasti fedeli…',
  'Completa l’ultima rilettura editoriale…',
  'Altri interventi editoriali',
  'Salvataggio automatico attivo',
  'Navigazione tra i capitoli',
  'Il tuo posto nella storia',
  'Capitolo precedente',
  'Scegli il capitolo',
  'Capitolo successivo',
  'Capitoli successivi bloccati',
  'Ultimo capitolo',
  'Salva e passa al capitolo successivo →',
  'Ogni capitolo comincia da una prima frase.',
  'Il capitolo sta prendendo forma.',
  'Sei vicino alla lunghezza prevista.',
  'Le tue parole appariranno qui mentre scrivi o detti il capitolo.',
  'Sto custodendo le tue parole…',
  'Le tue nuove parole saranno salvate tra pochi secondi…',
  'Le tue parole sono al sicuro · Salvato alle ',
  'Salvataggio online automatico attivo nel tuo account',
  'Sto custodendo i tuoi ricordi…',
  'Conferma la dichiarazione sui contenuti per attivare il salvataggio automatico',
  'Le modifiche saranno salvate tra pochi secondi…',
  'Le due password non coincidono.',
  'Assessment editoriale · ',
  'SCHEDA TECNICA DEL PROGETTO EDITORIALE',
  'Dimensione della trama del libro: ',
  'Nodi cruciali: ',
  'Parole-soglia: ',
  'Indice editoriale orientativo: '
];

for (const locale of ['de', 'en']) {
  const localizedCore = localizeDeepStudioScript(coreStudioRuntime, locale);
  for (const marker of lateDynamicItalianMarkers) {
    assert.ok(!localizedCore.includes(marker), `${locale}: late dynamic Studio residual: ${marker}`);
  }
}

const germanCore = localizeDeepStudioScript(coreStudioRuntime, 'de');
for (const expected of [
  'Weitere Überarbeitungen',
  'Automatisches Speichern aktiv',
  'Vorheriges Kapitel',
  'Letztes Kapitel',
  'Speichern und zum nächsten Kapitel →',
  'Die Muse liest deinen Text noch einmal',
  'Die beiden Passwörter stimmen nicht überein.'
]) assert.ok(germanCore.includes(expected), `de: expected polished Studio copy missing: ${expected}`);

const germanOnce = strengthenMuseOptions({
  messages: [{ role: 'system', content: "LINGUA DELL'OPERA: TEDESCO. Scrivi senza inventare." }]
});
const germanTwice = strengthenMuseOptions(germanOnce);
assert.equal((germanTwice.messages[0].content.match(/VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE/g) || []).length, 1, 'German Muse contract must be idempotent');

const englishOnce = strengthenMuseOptions({
  messages: [{ role: 'system', content: "LINGUA DELL'OPERA: INGLESE BRITANNICO. Scrivi senza inventare." }]
});
const englishTwice = strengthenMuseOptions(englishOnce);
assert.equal((englishTwice.messages[0].content.match(/MANDATORY LANGUAGE CONTRACT FOR THE MUSE/g) || []).length, 1, 'English Muse contract must be idempotent');

console.log('studio dynamic residual scan: ok');
