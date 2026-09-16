import assert from 'node:assert/strict';
import { applyGermanGhostwriter } from '../src/german-ghostwriter-worker.js';
import { applyGermanStyleV2 } from '../src/german-ghostwriter-style-v2-worker.js';
import { composeGermanEditorialOptions, editorialDefaultAction, editorialRequestRole, isGermanMachineControl } from '../src/german-editorial-room-worker.js';

const DE_MARKER = 'VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE';

function systemText(options) {
  return (options.messages || []).filter(m => m.role === 'system').map(m => m.content).join('\n');
}

function userText(options) {
  return (options.messages || []).filter(m => m.role === 'user').map(m => m.content).join('\n');
}

const cases = [
  {
    name: 'autobiography with scarce sources',
    role: 'ghostwriter',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nSchreibe ein autobiografisches Kapitel. Tono: Intimo e riflessivo. Genere: Autobiografia.` },
        { role: 'user', content: '1978 zog ich mit meiner Mutter nach Meran. Mehr weiß ich über diesen Abschnitt im Moment nicht.' }
      ]
    },
    expect: [/ROLLE — GHOSTWRITER/, /Bei zu wenig Material: enger und kürzer schreiben/, /Keine erfundenen Dialoge, Gedanken, Motive, Gefühle, Sinneseindrücke oder Kulissen/, /GENREPROFIL — AUTOBIOGRAFIE/, /TONPROFIL — INTIM UND REFLEKTIERT/]
  },
  {
    name: 'family history with South Tyrol terminology and historical quotation',
    role: 'ghostwriter',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nGenere: Storia di famiglia. Schreibe eine Familiengeschichte.` },
        { role: 'user', content: 'In Südtirol sagte mein Großvater 1962 wörtlich: „Morgen fahren wir nach Bozen.“ Er arbeitete damals bei der Kellerei.' }
      ]
    },
    expect: [/GENREPROFIL — FAMILIENGESCHICHTE/, /Regionale Begriffe, Ortsnamen, Institutionen und kulturelle Besonderheiten/, /historische Zitate, zeitgebundene Begriffe und die Sprache realer Dokumente dürfen nicht modernisiert/]
  },
  {
    name: 'company biography without PR inflation',
    role: 'ghostwriter',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nGenere: Biografia aziendale. Tono: Professionale e autorevole. Schreibe die Unternehmensgeschichte.` },
        { role: 'user', content: 'Der Betrieb wurde 1998 von Anna und Paul gegründet. 2004 kamen fünf Mitarbeitende hinzu.' }
      ]
    },
    expect: [/GENREPROFIL — UNTERNEHMENSBIOGRAFIE/, /Keine PR-Superlative/, /Marketingfloskeln, Übertreibungen und unnötigen Jargon vermeiden/]
  },
  {
    name: 'grammar correction remains conservative',
    role: 'lektor',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nÜberarbeite den vorhandenen Text sprachlich.` },
        { role: 'user', content: 'Wir sind nach Hause gegangen und danach ich habe meinen Bruder angerufen.' }
      ]
    },
    expect: [/ROLLE — LEKTOR/, /Keine neuen Beispiele, Bilder, Dialoge, Details oder Deutungen hinzufügen/, /Ziel ist ein druckreifer Text, nicht ein stilistisch anderer Text/],
    reject: [/PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH/, /ZEITGENÖSSISCHER GHOSTWRITER-STILPASS V2 — DEUTSCH/]
  },
  {
    name: 'vivid action cannot invent sensory detail',
    role: 'stilredaktion',
    action: 'vivid',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nRifinisci il testo.` },
        { role: 'user', content: 'Wir betraten das Büro. Auf dem Tisch lag der Vertrag.' }
      ]
    },
    expect: [/ROLLE — STILREDAKTION/, /AUFTRAG — ANSCHAULICHKEIT/, /Keine Farben, Gerüche, Gesten, Räume oder Sinneseindrücke ergänzen/]
  },
  {
    name: 'emotional action cannot invent feelings or motives',
    role: 'stilredaktion',
    action: 'emotional',
    options: {
      messages: [
        { role: 'system', content: `${DE_MARKER}\nRifinisci il testo.` },
        { role: 'user', content: 'Mein Vater legte den Brief auf den Tisch und ging hinaus.' }
      ]
    },
    expect: [/AUFTRAG — EMOTIONALE WIRKUNG/, /Keine Gefühle, Motive oder dramatischen Details erfinden/]
  }
];

for (const testCase of cases) {
  const beforeUser = userText(testCase.options);
  const result = composeGermanEditorialOptions(testCase.options, testCase.role, testCase.action || '');
  const afterSystem = systemText(result);
  const afterUser = userText(result);
  assert.equal(afterUser, beforeUser, `${testCase.name}: authored user content must stay byte-identical`);
  for (const pattern of testCase.expect) assert.match(afterSystem, pattern, `${testCase.name}: missing editorial safeguard ${pattern}`);
  for (const pattern of testCase.reject || []) assert.doesNotMatch(afterSystem, pattern, `${testCase.name}: forbidden broader prose contract ${pattern}`);
  assert.equal((afterSystem.match(/INTERNE REDAKTION SPLENDORIA — DEUTSCH/g) || []).length, 1, `${testCase.name}: editorial room must be injected exactly once`);
}

const machineOptions = {
  messages: [{
    role: 'system',
    content: `${DE_MARKER}\nSei il controllo qualità. Valuta la fedeltà alle fonti. Rispondi esclusivamente APPROVATO oppure RIFIUTATO. Se le fonti non bastano usa [FONTI_INSUFFICIENTI].`
  }]
};
assert.equal(isGermanMachineControl(machineOptions), true, 'machine quality control must be detected');
const machineResult = composeGermanEditorialOptions(machineOptions, 'ghostwriter');
const machineSystem = systemText(machineResult);
assert.match(machineSystem, /ROLLE — FAKTENKONTROLLE/);
assert.match(machineSystem, /APPROVATO, RIFIUTATO oder \[FONTI_INSUFFICIENTI\]/);
assert.doesNotMatch(machineSystem, /PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH/, 'fact checks must not inherit prose-generation contracts');
assert.doesNotMatch(machineSystem, /ZEITGENÖSSISCHER GHOSTWRITER-STILPASS V2 — DEUTSCH/, 'fact checks must not inherit style contracts');

// Strict-facts generation is still a writing task. It may mention the sentinel
// [FONTI_INSUFFICIENTI] and the word "verificato", but must not be mistaken for
// a verdict-only quality-control call. Otherwise a retry could stop rewriting
// and return a checker-style response instead of the requested chapter text.
const strictFactsRewrite = {
  messages: [
    {
      role: 'system',
      content: `${DE_MARKER}\nSei il revisore letterario finale. Prima di riscrivere, confronta internamente ogni affermazione concreta con le fonti autorizzate. Non sostituire un dettaglio non verificato con un'altra invenzione. Se le fonti non permettono una versione completa e fedele, restituisci esclusivamente [FONTI_INSUFFICIENTI]. Altrimenti riscrivi il testo in modo fedele.`
    },
    { role: 'user', content: '1978 zog ich mit meiner Mutter nach Meran. Das ist die einzige sichere Information.' }
  ]
};
assert.equal(isGermanMachineControl(strictFactsRewrite), false, 'strict-facts rewriting must not be classified as verdict-only machine control');
const strictFactsUserBefore = userText(strictFactsRewrite);
const strictFactsResult = composeGermanEditorialOptions(strictFactsRewrite, 'ghostwriter');
const strictFactsSystem = systemText(strictFactsResult);
assert.equal(userText(strictFactsResult), strictFactsUserBefore, 'strict-facts retry must preserve authored source text byte-identically');
assert.match(strictFactsSystem, /ROLLE — GHOSTWRITER/, 'strict-facts retry must remain in the writing path');
assert.match(strictFactsSystem, /PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH/, 'strict-facts retry must retain the German ghostwriter contract');
assert.match(strictFactsSystem, /ZEITGENÖSSISCHER GHOSTWRITER-STILPASS V2 — DEUTSCH/, 'strict-facts retry must retain the German style contract');
assert.doesNotMatch(strictFactsSystem, /ROLLE — FAKTENKONTROLLE/, 'strict-facts retry must not become a verdict-only fact checker');

assert.equal(editorialDefaultAction('/de/libro/book/migliora'), 'improve');
assert.equal(editorialDefaultAction('/de/libro/book/risposte/migliora'), 'improve');
assert.equal(editorialDefaultAction('/de/libro/book/capitolo/ch/rifinisci'), '');
const improveOptions = {
  messages: [
    { role: 'system', content: `${DE_MARKER}\nMigliora il testo senza inventare.` },
    { role: 'user', content: 'Der Satz ist etwas schwer, aber inhaltlich korrekt.' }
  ]
};
const improveResult = composeGermanEditorialOptions(improveOptions, 'stilredaktion', editorialDefaultAction('/de/libro/book/migliora'));
assert.match(systemText(improveResult), /AUFTRAG — ALLGEMEINE STILVERBESSERUNG/);

assert.equal(editorialRequestRole('/de/libro/book/capitolo/ch/rifinisci', 'grammar'), 'lektor');
assert.equal(editorialRequestRole('/de/libro/book/capitolo/ch/rifinisci', 'vivid'), 'stilredaktion');
assert.equal(editorialRequestRole('/de/libro/book/capitolo/ch/genera'), 'ghostwriter');
assert.equal(editorialRequestRole('/en/libro/book/capitolo/ch/genera'), 'ghostwriter', 'route role is locale-neutral; runtime language preference is the actual gate');
assert.equal(editorialRequestRole('/de/admin', ''), '', 'admin must never enter the editorial room');
assert.equal(editorialRequestRole('/de/libro/book/salva', ''), '', 'plain persistence must never trigger an AI editorial role');

const nonGerman = {
  messages: [{ role: 'system', content: 'MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH\nWrite naturally.' }, { role: 'user', content: 'My mother moved to London in 1980.' }]
};
assert.strictEqual(applyGermanGhostwriter(nonGerman), nonGerman, 'German ghostwriter must not touch English');
assert.strictEqual(applyGermanStyleV2(nonGerman), nonGerman, 'German style pass must not touch English');
assert.strictEqual(composeGermanEditorialOptions(nonGerman, 'ghostwriter'), nonGerman, 'German editorial composition must not touch English');

console.log('German editorial qualitative cases: ok');
