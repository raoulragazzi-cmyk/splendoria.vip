import assert from 'node:assert/strict';
import {
  canonicalPath,
  injectEditorControls,
  injectLocaleSwitcher,
  injectNewBookControls,
  localizeMuseOptions,
  projectIdFromPath
} from '../src/studio-language-worker.js';

assert.equal(canonicalPath('/de/studio'), '/studio');
assert.equal(canonicalPath('/en/libro/abc'), '/libro/abc');
assert.equal(canonicalPath('/studio'), '/studio');
assert.equal(projectIdFromPath('/de/libro/book-123/capitolo/ch-1/genera'), 'book-123');
assert.equal(projectIdFromPath('/account'), '');

const switcherHtml = '<html><head></head><body><nav><div class="navlinks"><a href="/studio">Studio</a></div></nav></body></html>';
const switched = injectLocaleSwitcher(switcherHtml, new URL('https://www.splendoria.vip/en/studio?from=mail'), 'en');
assert.match(switched, /data-studio-locale-switcher/);
assert.match(switched, /href="\/studio\?from=mail"/);
assert.match(switched, /href="\/de\/studio\?from=mail"/);
assert.match(switched, /href="\/en\/studio\?from=mail"[^>]*aria-current="page"/);

const newBookHtml = '<form method="post" action="/de/nuovo-libro"><div class="grid three"><label>Titel<input name="title"></label></div><p class="small muted">Hilfe</p><button>OK</button></form>';
const newBookLocalized = injectNewBookControls(newBookHtml, 'de');
assert.match(newBookLocalized, /data-book-language-panel/);
assert.match(newBookLocalized, /name="bookLanguage"/);
assert.match(newBookLocalized, /value="de-DE" selected/);
assert.match(newBookLocalized, /name="museOutputLanguage"/);
assert.match(newBookLocalized, /Sprache des Buches/);

const editorHtml = '<form class="wow-panel" method="post" action="/en/libro/book-123/salva"><p class="eyebrow">Soul</p><h2>Before words</h2><label>Title</label></form><aside><select id="voice" data-voice-language><option value="it-IT">Italiano</option><option value="de-DE">Deutsch</option><option value="en-GB">English</option></select></aside>';
const editorLocalized = injectEditorControls(editorHtml, 'en', {
  bookLanguage: 'it-IT',
  museOutputLanguage: 'en-GB',
  dictationLanguage: 'de-DE'
});
assert.match(editorLocalized, /id="spl-book-settings"/);
assert.match(editorLocalized, /Book language/);
assert.match(editorLocalized, /name="bookLanguage"/);
assert.match(editorLocalized, /name="museOutputLanguage"/);
assert.match(editorLocalized, /value="it-IT" selected/);
assert.match(editorLocalized, /data-voice-language[^>]*name="dictationLanguage"[^>]*form="spl-book-settings"/);
assert.match(editorLocalized, /value="de-DE" selected/);

const source = {
  messages: [
    { role: 'system', content: 'Formula esattamente 8 domande in italiano. Non inventare fatti.' },
    { role: 'user', content: 'Mia madre diceva: scrivevo in italiano, ma vivevamo a Köln.' }
  ],
  temperature: 0.2
};
const german = localizeMuseOptions(source, 'de-DE');
assert.notStrictEqual(german, source);
assert.match(german.messages[0].content, /LINGUA DELL'OPERA: TEDESCO/);
assert.match(german.messages[0].content, /domande in tedesco/i);
assert.equal(german.messages[1].content, source.messages[1].content, 'user-authored content must remain byte-identical');
assert.equal(german.temperature, 0.2);

const outline = localizeMuseOptions({ prompt: 'Crea un indice di 12 capitoli per un libro in italiano. Titolo: Meine Geschichte.' }, 'en-GB');
assert.match(outline.prompt, /LINGUA DELL'OPERA: INGLESE BRITANNICO/);
assert.match(outline.prompt, /per un libro in inglese britannico/i);

const validator = {
  messages: [{ role: 'system', content: 'Sei il controllo qualità. Valuta. Rispondi esclusivamente APPROVATO oppure RIFIUTATO.' }]
};
assert.strictEqual(localizeMuseOptions(validator, 'de-DE'), validator, 'machine control tokens must remain canonical');
assert.strictEqual(localizeMuseOptions(source, 'it-IT'), source, 'Italian projects must preserve the current AI contract exactly');

console.log('studio-language smoke: ok');
