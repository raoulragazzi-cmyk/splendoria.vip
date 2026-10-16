import assert from 'node:assert/strict';
import { applyGermanEditorialRole } from '../src/german-editorial-room-worker.js';

const DE = 'PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH';
const authored = 'Meine Mutter sagte: „Das war unser Laden.“ 1998 zogen wir nach Bozen.';

const ghost = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nSchreibe das Kapitel.` },
    { role: 'user', content: authored }
  ]
}, 'ghostwriter');
assert.match(ghost.messages[0].content, /STIMMPROFIL/);
assert.match(ghost.messages[0].content, /Dünnes Material nicht aufblasen/);
assert.match(ghost.messages[0].content, /Keine künstliche Pointe/);

const targeted = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nSchreibe ungefähr 220 Wörter und bleibe bei den bereitgestellten Quellen.` },
    { role: 'user', content: authored }
  ]
}, 'ghostwriter');
assert.match(targeted.messages[0].content, /Zielgröße: ungefähr 220 Wörter/);
assert.match(targeted.messages[0].content, /±10 %/);
assert.match(targeted.messages[0].content, /bewusst kürzer bleiben/);

const grammar = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nKorrigiere nur die Grammatik.` },
    { role: 'user', content: authored }
  ]
}, 'lektor', 'grammar');
assert.match(grammar.messages[0].content, /95–105 %/);
assert.match(grammar.messages[0].content, /STIMMPROFIL/);

for (const action of ['improve', 'clarity', 'emotional', 'vivid', 'elegant']) {
  const result = applyGermanEditorialRole({
    messages: [
      { role: 'system', content: `${DE}\nÜberarbeite den vorhandenen Text.` },
      { role: 'user', content: authored }
    ]
  }, 'stilredaktion', action);
  assert.match(result.messages[0].content, /90–110 %/, action);
  assert.match(result.messages[0].content, /STIMMPROFIL/, action);
}

const shortened = applyGermanEditorialRole({
  messages: [
    { role: 'system', content: `${DE}\nKürze den vorhandenen Text.` },
    { role: 'user', content: authored }
  ]
}, 'stilredaktion', 'short');
assert.match(shortened.messages[0].content, /70–80 %/);

const facts = applyGermanEditorialRole({
  messages: [{
    role: 'system',
    content: 'Sei der controllo qualità. Verifica la fedeltà alle fonti. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.'
  }]
}, 'ghostwriter');
assert.doesNotMatch(facts.messages[0].content, /STIMMPROFIL/);
assert.doesNotMatch(facts.messages[0].content, /LÄNGENVERTRAG/);

console.log('German Muse style/length v3 smoke: ok');
