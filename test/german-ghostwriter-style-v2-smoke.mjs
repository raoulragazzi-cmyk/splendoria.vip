import assert from 'node:assert/strict';
import { applyGermanStyleV2, detectGermanGenre } from '../src/german-ghostwriter-style-v2-worker.js';

const BASE = 'PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH';
const authored = 'Meine Mutter sagte: „Das war unser Laden.“ Danach zogen wir nach Bozen.';

const autobiography = {
  messages: [
    { role: 'system', content: `${BASE}\nSchreibe das Kapitel weiter.` },
    { role: 'user', content: `Genere: Autobiografia\n${authored}` }
  ],
  temperature: 0.2
};
assert.equal(detectGermanGenre(autobiography), 'autobiografie');
const autoResult = applyGermanStyleV2(autobiography);
assert.notStrictEqual(autoResult, autobiography);
assert.match(autoResult.messages[0].content, /ZEITGENÖSSISCHER GHOSTWRITER-STILPASS V2 — DEUTSCH/);
assert.match(autoResult.messages[0].content, /SPRACHZIEL 2026: MODERN, FRISCH, UNAUFDRINGLICH/);
assert.match(autoResult.messages[0].content, /GENREPROFIL — AUTOBIOGRAFIE/);
assert.match(autoResult.messages[0].content, /DACH-Raum/);
assert.match(autoResult.messages[0].content, /„entscheiden“ statt „eine Entscheidung treffen“/);
assert.match(autoResult.messages[0].content, /Anti-KI|ANTI-KI-LEKTORAT/i);
assert.equal(autoResult.messages[1].content, autobiography.messages[1].content, 'authored user content must stay byte-identical');
assert.equal(autoResult.temperature, 0.2);
assert.strictEqual(applyGermanStyleV2(autoResult), autoResult, 'style layer must be idempotent');

for (const [genreText, expected, marker] of [
  ['Memoriale', 'memoir', 'GENREPROFIL — MEMOIR'],
  ['Storia di famiglia', 'familiengeschichte', 'GENREPROFIL — FAMILIENGESCHICHTE'],
  ['Biografia aziendale', 'unternehmensbiografie', 'GENREPROFIL — UNTERNEHMENSBIOGRAFIE'],
  ['Romanzo', 'roman', 'GENREPROFIL — ROMAN / NARRATIVE LITERARISCHE FORM']
]) {
  const options = {
    messages: [
      { role: 'system', content: `${BASE}\nArbeite redaktionell weiter.` },
      { role: 'user', content: `Genere: ${genreText}\nFakt: Der Betrieb wurde 1998 gegründet.` }
    ]
  };
  assert.equal(detectGermanGenre(options), expected);
  const result = applyGermanStyleV2(options);
  assert.match(result.messages[0].content, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(result.messages[1].content, options.messages[1].content);
}

const regional = {
  messages: [
    { role: 'system', content: `${BASE}\nSchreibe in modernem Deutsch.` },
    { role: 'user', content: 'Genre: Memoiren\nWir lebten in Südtirol und arbeiteten mit der Kellerei zusammen.' }
  ]
};
const regionalResult = applyGermanStyleV2(regional);
assert.match(regionalResult.messages[0].content, /Südtirol/);
assert.match(regionalResult.messages[0].content, /Regionale Begriffe, Ortsnamen, Institutionen/);
assert.equal(regionalResult.messages[1].content, regional.messages[1].content);

const promptOnly = {
  prompt: `${BASE}\nGenere: Biografia aziendale\nTitolo: Unser Betrieb\nFakt: 1998 gegründet.`
};
const promptResult = applyGermanStyleV2(promptOnly);
assert.match(promptResult.prompt, /GENREPROFIL — UNTERNEHMENSBIOGRAFIE/);
assert.match(promptResult.prompt, /Titolo: Unser Betrieb/);
assert.match(promptResult.prompt, /Fakt: 1998 gegründet/);

const machine = {
  messages: [{ role: 'system', content: `${BASE}\nSei il controllo qualità. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.` }]
};
assert.strictEqual(applyGermanStyleV2(machine), machine, 'machine-control prompts must remain untouched');

const english = {
  messages: [{ role: 'system', content: 'MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH\nWrite naturally.' }]
};
assert.strictEqual(applyGermanStyleV2(english), english, 'English path must remain untouched');

const italian = {
  messages: [{ role: 'system', content: 'Scrivi in italiano con precisione.' }]
};
assert.strictEqual(applyGermanStyleV2(italian), italian, 'Italian path must remain untouched');

console.log('german ghostwriter style v2 smoke: ok');
