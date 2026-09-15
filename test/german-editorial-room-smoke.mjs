import assert from 'node:assert/strict';
import {
  applyGermanEditorialRole,
  canonicalEditorialPath,
  editorialRequestRole,
  isGermanMachineControl
} from '../src/german-editorial-room-worker.js';

const DE = 'PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH';
const authored = 'Meine Mutter sagte: „Das war unser Laden.“ 1998 zogen wir nach Bozen.';

assert.equal(canonicalEditorialPath('/de/libro/book-1/capitolo/ch-1/genera'), '/libro/book-1/capitolo/ch-1/genera');
assert.equal(canonicalEditorialPath('/en/libro/book-1/rifinisci'), '/libro/book-1/rifinisci');

for (const path of [
  '/de/libro/book-1/affidati',
  '/de/libro/book-1/struttura',
  '/de/libro/book-1/intervista',
  '/de/libro/book-1/risposte/affidati',
  '/de/libro/book-1/capitolo/ch-1/genera'
]) assert.equal(editorialRequestRole(path), 'ghostwriter', path);

assert.equal(editorialRequestRole('/de/libro/book-1/migliora'), 'stilredaktion');
assert.equal(editorialRequestRole('/de/libro/book-1/risposte/migliora'), 'stilredaktion');
assert.equal(editorialRequestRole('/de/libro/book-1/capitolo/ch-1/rifinisci', 'grammar'), 'lektor');
for (const action of ['improve', 'clarity', 'emotional', 'vivid', 'elegant', 'short']) {
  assert.equal(editorialRequestRole('/de/libro/book-1/capitolo/ch-1/rifinisci', action), 'stilredaktion', action);
}
assert.equal(editorialRequestRole('/de/libro/book-1/capitolo/ch-1/salva'), '');
assert.equal(editorialRequestRole('/de/libro/book-1/elimina'), '');
assert.equal(editorialRequestRole('/admin'), '');

const ghostwriter = {
  messages: [
    { role: 'system', content: `${DE}\nSchreibe das Kapitel.` },
    { role: 'user', content: authored }
  ],
  temperature: 0.25
};
const ghostResult = applyGermanEditorialRole(ghostwriter, 'ghostwriter');
assert.notStrictEqual(ghostResult, ghostwriter);
assert.match(ghostResult.messages[0].content, /INTERNE REDAKTION SPLENDORIA — DEUTSCH/);
assert.match(ghostResult.messages[0].content, /ROLLE — GHOSTWRITER/);
assert.match(ghostResult.messages[0].content, /Bei zu wenig Material: enger und kürzer schreiben/);
assert.equal(ghostResult.messages[1].content, authored, 'Ghostwriter role must not rewrite authored user messages');
assert.equal(ghostResult.temperature, 0.25);
assert.strictEqual(applyGermanEditorialRole(ghostResult, 'ghostwriter'), ghostResult, 'editorial room injection must be idempotent');

const lektor = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nKorrigiere nur die Grammatik.` },
    { role: 'user', content: authored }
  ]
}, 'lektor', 'grammar');
assert.match(lektor.messages[0].content, /ROLLE — LEKTOR/);
assert.match(lektor.messages[0].content, /druckreifer Text, nicht ein stilistisch anderer Text/);
assert.equal(lektor.messages[1].content, authored);

for (const [action, marker] of [
  ['improve', 'ALLGEMEINE STILVERBESSERUNG'],
  ['clarity', 'KLARHEIT UND FLUSS'],
  ['emotional', 'EMOTIONALE WIRKUNG'],
  ['vivid', 'ANSCHAULICHKEIT'],
  ['elegant', 'ELEGANZ'],
  ['short', 'VERDICHTUNG']
]) {
  const result = applyGermanEditorialRole({
    messages: [
      { role: 'system', content: `${DE}\nÜberarbeite den vorhandenen Text.` },
      { role: 'user', content: authored }
    ]
  }, 'stilredaktion', action);
  assert.match(result.messages[0].content, /ROLLE — STILREDAKTION/);
  assert.match(result.messages[0].content, new RegExp(`AUFTRAG — ${marker}`));
  assert.equal(result.messages[1].content, authored, `${action}: user content must remain byte-identical`);
}

const machine = {
  messages: [{ role: 'system', content: 'Sei der controllo qualità. Verifica la fedeltà alle fonti. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.' }]
};
assert.equal(isGermanMachineControl(machine), true);
const factResult = applyGermanEditorialRole(machine, 'ghostwriter');
assert.match(factResult.messages[0].content, /ROLLE — FAKTENKONTROLLE/);
assert.match(factResult.messages[0].content, /Plausibilität ist kein Beleg/);
assert.match(factResult.messages[0].content, /APPROVATO, RIFIUTATO oder \[FONTI_INSUFFICIENTI\]/);
assert.match(factResult.messages[0].content, /Rispondi esclusivamente APPROVATO oppure RIFIUTATO/);

const insufficient = {
  messages: [{ role: 'system', content: 'Verifica se le fonti sono sufficienti. Se non bastano restituisci [FONTI_INSUFFICIENTI].' }]
};
assert.equal(isGermanMachineControl(insufficient), true);
assert.match(applyGermanEditorialRole(insufficient, 'ghostwriter').messages[0].content, /ROLLE — FAKTENKONTROLLE/);

const english = { messages: [{ role: 'system', content: 'MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH\nWrite naturally.' }] };
assert.strictEqual(applyGermanEditorialRole(english, 'ghostwriter'), english, 'English path must be untouched by the German editorial room');
const italian = { messages: [{ role: 'system', content: 'Scrivi in italiano con precisione.' }] };
assert.strictEqual(applyGermanEditorialRole(italian, 'stilredaktion', 'clarity'), italian, 'Italian path must be untouched by the German editorial room');

const promptOnly = { prompt: `${DE}\nCrea un indice in tedesco.` };
const promptResult = applyGermanEditorialRole(promptOnly, 'ghostwriter');
assert.match(promptResult.prompt, /ROLLE — GHOSTWRITER/);
assert.match(promptResult.prompt, /Crea un indice in tedesco/);

console.log('German internal editorial room smoke: ok');
