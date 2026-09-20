import assert from 'node:assert/strict';
import {
  applyGermanGhostwriter,
  detectGermanGhostwriterMode,
  detectGermanTone
} from '../src/german-ghostwriter-worker.js';

const DE_MARKER = 'VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE';

const authored = 'Meine Mutter sagte: „Ich schreibe in italiano“, und wir lebten damals in Bozen.';
const narrative = {
  messages: [
    {
      role: 'system',
      content: `${DE_MARKER}\nLINGUA DELL'OPERA: TEDESCO. Schreibe ein Kapitel. Tono: Intimo e riflessivo.`
    },
    { role: 'user', content: authored }
  ],
  temperature: 0.2
};

assert.equal(detectGermanGhostwriterMode(narrative), 'narrative');
assert.equal(detectGermanTone(narrative), 'Intimo e riflessivo');
const ghostNarrative = applyGermanGhostwriter(narrative);
assert.notStrictEqual(ghostNarrative, narrative);
assert.match(ghostNarrative.messages[0].content, /PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH/);
assert.match(ghostNarrative.messages[0].content, /MODUS — NARRATIVES GHOSTWRITING/);
assert.match(ghostNarrative.messages[0].content, /TONPROFIL — INTIM UND REFLEKTIERT/);
assert.match(ghostNarrative.messages[0].content, /DACH-Raum/);
assert.match(ghostNarrative.messages[0].content, /aktuellen, frischen Wortschatz/);
assert.match(ghostNarrative.messages[0].content, /Keine erfundenen Dialoge/);
assert.match(ghostNarrative.messages[0].content, /typische KI-Signale/);
assert.match(ghostNarrative.messages[0].content, /LÄNGENSTEUERUNG/);
assert.match(ghostNarrative.messages[0].content, /±10 %/);
assert.match(ghostNarrative.messages[0].content, /Quellenlage hat Vorrang vor Umfang/);
assert.match(ghostNarrative.messages[0].content, /300 bis 400 Wörter/);
assert.equal(ghostNarrative.messages[1].content, authored, 'author text must remain byte-identical');
assert.equal(ghostNarrative.temperature, 0.2);

const secondPass = applyGermanGhostwriter(ghostNarrative);
assert.strictEqual(secondPass, ghostNarrative, 'ghostwriter layer must be idempotent');

const outline = {
  prompt: `${DE_MARKER}\nCrea un indice di esattamente 12 capitoli per un libro in tedesco. Titolo: Mein Leben.`
};
assert.equal(detectGermanGhostwriterMode(outline), 'outline');
const ghostOutline = applyGermanGhostwriter(outline);
assert.match(ghostOutline.prompt, /MODUS — GLIEDERUNG UND KAPITELTITEL/);
assert.match(ghostOutline.prompt, /Keine erfundenen Ereignisse/);
assert.match(ghostOutline.prompt, /Von X zu Y/);
assert.match(ghostOutline.prompt, /Titolo: Mein Leben/);

const interview = {
  messages: [{ role: 'system', content: `${DE_MARKER}\nFormula esattamente 8 domande in tedesco per l’intervista.` }]
};
assert.equal(detectGermanGhostwriterMode(interview), 'interview');
assert.match(applyGermanGhostwriter(interview).messages[0].content, /MODUS — GHOSTWRITER-INTERVIEW/);
assert.match(applyGermanGhostwriter(interview).messages[0].content, /Keine Suggestivfragen/);

const editor = {
  messages: [{ role: 'system', content: `${DE_MARKER}\nSei il revisore letterario finale. Rileggi e rifinisci il testo.` }]
};
assert.equal(detectGermanGhostwriterMode(editor), 'editor');
assert.match(applyGermanGhostwriter(editor).messages[0].content, /MODUS — PROFESSIONELLES LEKTORAT/);
assert.match(applyGermanGhostwriter(editor).messages[0].content, /konservativ redigieren/);

for (const [tone, marker] of [
  ['Emozionante e autentico', 'TONPROFIL — EMOTIONAL UND AUTHENTISCH'],
  ['Intimo e riflessivo', 'TONPROFIL — INTIM UND REFLEKTIERT'],
  ['Leggero e brillante', 'TONPROFIL — LEICHT UND GEISTREICH'],
  ['Professionale e autorevole', 'TONPROFIL — PROFESSIONELL UND SOUVERÄN']
]) {
  const options = {
    messages: [
      { role: 'system', content: `${DE_MARKER}\nSchreibe weiter.` },
      { role: 'user', content: `Tono: ${tone}. Fakt: Der Betrieb wurde 1998 gegründet.` }
    ]
  };
  assert.equal(detectGermanTone(options), tone);
  const result = applyGermanGhostwriter(options);
  assert.match(result.messages[0].content, new RegExp(marker));
  assert.equal(result.messages[1].content, options.messages[1].content, 'tone detection must inspect but never rewrite user content');
}

const english = {
  messages: [{ role: 'system', content: 'MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH\nWrite the chapter.' }]
};
assert.strictEqual(applyGermanGhostwriter(english), english, 'English brain must remain untouched');

const italian = {
  messages: [{ role: 'system', content: 'Scrivi in italiano con precisione.' }]
};
assert.strictEqual(applyGermanGhostwriter(italian), italian, 'Italian brain must remain untouched');

const validator = {
  messages: [{ role: 'system', content: 'Sei il controllo qualità. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.' }]
};
assert.strictEqual(applyGermanGhostwriter(validator), validator, 'machine-control path without German language marker must remain untouched');

const tokenSafety = {
  messages: [{ role: 'system', content: `${DE_MARKER}\nSe le fonti non bastano restituisci [FONTI_INSUFFICIENTI].` }]
};
const tokenResult = applyGermanGhostwriter(tokenSafety);
assert.match(tokenResult.messages[0].content, /\[FONTI_INSUFFICIENTI\]/, 'machine token must survive exactly');

console.log('german ghostwriter smoke: ok');
