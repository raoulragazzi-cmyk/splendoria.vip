import assert from 'node:assert/strict';
import {
  applyGermanEditorialRole,
  canonicalEditorialPath,
  editorialRequestRole,
  germanEditorialModel,
  isGermanMachineControl
} from '../src/german-editorial-room-worker.js';

const DE = 'PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH';
const authored = 'Meine Mutter sagte: „Das war unser Laden.“ 1998 zogen wir nach Bozen.';
const QWEN = '@cf/qwen/qwen3.8-27b';
const LEGACY = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const EDITOR = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

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
assert.equal(germanEditorialModel(QWEN, ghostwriter, 'ghostwriter'), QWEN, 'Qwen selected by canonical chapter generation must be preserved');
assert.equal(germanEditorialModel(LEGACY, ghostwriter, 'ghostwriter'), LEGACY, 'Non-Qwen writer model selected by canonical core must also be preserved');

const finalEditorialPass = {
  messages: [{ role: 'system', content: `${DE}\nSei il revisore letterario finale di Splendoria. Restituisci soltanto il testo revisionato.` }]
};
assert.equal(germanEditorialModel(QWEN, finalEditorialPass, 'ghostwriter'), EDITOR, 'Recognised final editorial pass may use the editor model');

const lektor = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nKorrigiere nur die Grammatik.` },
    { role: 'user', content: authored }
  ]
}, 'lektor', 'grammar');
assert.match(lektor.messages[0].content, /ROLLE — LEKTOR/);
assert.match(lektor.messages[0].content, /druckreifer Text, nicht ein stilistisch anderer Text/);
assert.equal(lektor.messages[1].content, authored);
assert.equal(germanEditorialModel(QWEN, lektor, 'lektor'), EDITOR, 'German grammar review must use the editor model');

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
  assert.equal(germanEditorialModel(QWEN, result, 'stilredaktion'), EDITOR, `${action}: style edit must use editor model`);
}

const machine = {
  messages: [{ role: 'system', content: 'Sei der controllo qualità. Verifica la fedeltà alle fonti. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.' }]
};
assert.equal(isGermanMachineControl(machine), true);
assert.equal(germanEditorialModel(QWEN, machine, 'ghostwriter'), EDITOR, 'Fact control must use editor model');
const factResult = applyGermanEditorialRole(machine, 'ghostwriter');
assert.match(factResult.messages[0].content, /ROLLE — FAKTENKONTROLLE/);
assert.match(factResult.messages[0].content, /Plausibilität ist kein Beleg/);
assert.match(factResult.messages[0].content, /APPROVATO, RIFIUTATO oder \[FONTI_INSUFFICIENTI\]/);
assert.match(factResult.messages[0].content, /Rispondi esclusivamente APPROVATO oppure RIFIUTATO/);

const insufficient = {
  messages: [{ role: 'system', content: 'Verifica se le fonti sono sufficienti. Se non bastano restituisci [FONTI_INSUFFICIENTI].' }]
};
assert.equal(isGermanMachineControl(insufficient), true);
assert.equal(germanEditorialModel(QWEN, insufficient, 'ghostwriter'), EDITOR);
assert.match(applyGermanEditorialRole(insufficient, 'ghostwriter').messages[0].content, /ROLLE — FAKTENKONTROLLE/);

const english = { messages: [{ role: 'system', content: 'MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH\nWrite naturally.' }] };
assert.strictEqual(applyGermanEditorialRole(english, 'ghostwriter'), english, 'English path must be untouched by the German editorial room');
const italian = { messages: [{ role: 'system', content: 'Scrivi in italiano con precisione.' }] };
assert.strictEqual(applyGermanEditorialRole(italian, 'stilredaktion', 'clarity'), italian, 'Italian path must be untouched by the German editorial room');

const promptOnly = { prompt: `${DE}\nCrea un indice in tedesco.` };
const promptResult = applyGermanEditorialRole(promptOnly, 'ghostwriter');
assert.match(promptResult.prompt, /ROLLE — GHOSTWRITER/);
assert.match(promptResult.prompt, /Crea un indice in tedesco/);
assert.equal(germanEditorialModel(LEGACY, promptOnly, 'ghostwriter'), LEGACY, 'Prompt-only writer calls must preserve canonical model choice');

console.log('German internal editorial room smoke: ok');
