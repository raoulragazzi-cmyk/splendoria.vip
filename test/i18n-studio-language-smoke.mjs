import assert from 'node:assert/strict';
import fs from 'node:fs';
import { narrativeInstruction, withNarrativeLanguage, languageLinks, localizeKnownPostProductionResiduals } from '../src/i18n-studio-language-worker.js';

const deInstruction = narrativeInstruction('de');
const enInstruction = narrativeInstruction('en');
assert.match(deInstruction, /Deutsch/);
assert.match(enInstruction, /English/);
assert.match(deInstruction, /Fakten/);
assert.match(enInstruction, /facts/);

const calls = [];
const baseEnv = {
  AI: {
    async run(model, input, options) {
      calls.push({ model, input, options });
      return { ok: true };
    }
  }
};

const deEnv = withNarrativeLanguage(baseEnv, 'de');
await deEnv.AI.run('@cf/test', { messages: [{ role: 'user', content: 'Schreibe weiter.' }] });
assert.equal(calls.length, 1);
assert.equal(calls[0].input.messages[0].role, 'system');
assert.match(calls[0].input.messages[0].content, /Erzählsprache/);
assert.equal(calls[0].input.messages[1].content, 'Schreibe weiter.');

const enEnv = withNarrativeLanguage(baseEnv, 'en');
await enEnv.AI.run('@cf/test', { prompt: 'Revise this chapter.' });
assert.match(calls[1].input.prompt, /narrative language of this book project is English/i);
assert.match(calls[1].input.prompt, /Revise this chapter\./);

const itEnv = withNarrativeLanguage(baseEnv, 'it');
assert.equal(itEnv, baseEnv, 'Italian canonical AI binding must remain untouched');

const url = new URL('https://www.splendoria.vip/de/libro/abc123?from=studio');
const switcher = languageLinks(url, 'de');
assert.match(switcher, /href="\/libro\/abc123\?from=studio"/);
assert.match(switcher, /href="\/de\/libro\/abc123\?from=studio"/);
assert.match(switcher, /href="\/en\/libro\/abc123\?from=studio"/);
assert.match(switcher, /aria-current="page"/);

const deResidual = localizeKnownPostProductionResiduals('Zuletzt aktualisiert: 29 agosto 2026 >Trasparenza sull’intelligenza artificiale< Guida allo Studio con indirizzo geografico in Via Goethe 42, Merano e Via Settala 1');
assert.doesNotMatch(deResidual, /agosto|Trasparenza sull’intelligenza artificiale|Guida allo Studio|con indirizzo geografico in|Merano e Via Settala/);
assert.match(deResidual, /29\. August 2026/);
assert.match(deResidual, /Transparenz bei künstlicher Intelligenz/);

const enResidual = localizeKnownPostProductionResiduals('Last updated: 12 agosto 2026 >Trasparenza sull’intelligenza artificiale< Guida allo Studio con indirizzo geografico in Via Goethe 42, Merano e Via Settala 1');
assert.doesNotMatch(enResidual, /agosto|Trasparenza sull’intelligenza artificiale|Guida allo Studio|con indirizzo geografico in|Merano e Via Settala/);
assert.match(enResidual, /12 August 2026/);
assert.match(enResidual, /Artificial intelligence transparency/);

const source = fs.readFileSync(new URL('../src/i18n-studio-language-worker.js', import.meta.url), 'utf8');
assert.match(source, /BookProjectLanguage/);
assert.match(source, /spl-book-language/);
assert.match(source, /x-splendoria-book-language/);
assert.doesNotMatch(source, /\/admin\/lingua|\/de\/admin|\/en\/admin/);

const migration = fs.readFileSync(new URL('../migrations/0005_book_project_language.sql', import.meta.url), 'utf8');
assert.match(migration, /CHECK \("bookLanguage" IN \('it', 'de', 'en'\)\)/);
assert.match(migration, /ON DELETE CASCADE/);

console.log('Studio trilingual language smoke: OK');
