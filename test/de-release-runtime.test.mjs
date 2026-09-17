import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
// This is wrangler.jsonc's final entrypoint, not an intermediate i18n wrapper.
import worker from '../src/german-editorial-room-worker.js';
import { injectEditorControls } from '../src/studio-language-worker.js';
import { createDictationHarness } from './helpers/dictation-harness.mjs';

const env = { APP_URL: 'https://www.splendoria.vip', DB: {
  prepare(sql = '') { return {
    bind() { return this; }, async first() { return sql === 'SELECT 1 AS ok' ? { ok: 1 } : null; },
    async all() { return { results: [] }; }, async run() { return { success: true }; }
  }; }, async batch(items) { return items.map(() => ({ success: true })); }
} };
// URL is synthetic: invoke the Worker directly, never the live app or a remote database.
const get = path => worker.fetch(new Request(env.APP_URL + path), env, {});
const asset = await get('/assets/studio.js?lang=de');
const de = await asset.text();
const start = de.indexOf('const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;');
const end = de.indexOf("document.querySelectorAll('textarea[data-word-count]')", start);
assert.ok(start >= 0 && end > start);
const controller = de.slice(start, end) + "document.querySelectorAll('textarea[data-word-count]');";

test('final German asset applies v2 rather than silently falling back', () => {
  assert.equal(asset.status, 200); assert.equal(asset.headers.get('x-spl-dictation-ux'), 'de-v2');
  assert.equal((de.match(/spl-dictation-de-ux-v2/g) || []).length, 3);
  assert.match(de, /Deine Änderungen bleiben erhalten/); assert.match(de, /bookBoundLanguage/);
  assert.doesNotThrow(() => new vm.Script(de));
});
test('manual editing stays protected after the entire runtime translation chain', async () => {
  const h = createDictationHarness(controller, { delayedEnd: true });
  h.buttons[0].click(); h.result('Zwischentext', false); h.edit('a', '  Meine Fassung\n\n');
  h.result('Später Text'); await h.end();
  assert.equal(h.targets.a.value, '  Meine Fassung\n\n'); assert.equal(h.state.requests.length, 0);
  assert.match(h.statuses[0].textContent, /Änderungen bleiben erhalten/);
});
test('repeated final slots remain distinct in the final asset', () => {
  const h = createDictationHarness(controller); h.buttons[0].click();
  h.results([['ja', true], ['ja', true], ['schon', true], ['schön', true]]);
  assert.equal(h.targets.a.value, 'Vorgeschichte A. ja ja schon schön');
});
test('book preference contract matches the actual rendered select and the final controller', () => {
  const html = injectEditorControls('<form class="wow-panel"><label>Titel</label></form><select data-voice-language><option value="it-IT">Italiano</option><option value="de-DE">Deutsch</option></select>', 'de', { bookLanguage: 'de-DE', museOutputLanguage: 'de-DE', dictationLanguage: 'it-IT' });
  assert.match(html, /data-voice-language[^>]*name="dictationLanguage"[^>]*form="spl-book-settings"/);
  assert.match(html, /value="it-IT" selected/);
  const h = createDictationHarness(controller, { bookLanguage: 'it-IT', storedLanguage: 'de-DE' });
  h.buttons[0].click(); assert.equal(h.state.recognition.lang, 'it-IT');
});
for (const locale of ['it', 'en']) test(locale + ' final asset does not receive the German-only patch', async () => {
  const r = await get('/assets/studio.js?lang=' + locale); const body = await r.text();
  assert.equal(r.status, 200); assert.equal(r.headers.has('x-spl-dictation-ux'), false);
  assert.doesNotMatch(body, /spl-dictation-de-ux|voiceManualEdit|bookBoundLanguage/);
  assert.doesNotThrow(() => new vm.Script(body));
});
const publicRoutes = ['/', '/guida', '/privacy-policy', '/cookie-policy', '/termini-condizioni', '/note-legali', '/trasparenza-ai', '/registrati', '/area-clienti', '/password-dimenticata'];
for (const route of publicRoutes) test('German footer is complete on ' + route, async () => {
  const r = await get('/de' + route); const html = await r.text();
  assert.equal(r.status, 200); const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer); assert.match(footer, />Studio-Leitfaden<\/a>/);
  assert.doesNotMatch(footer, /Leitfaden allo Studio|La tua vita in un romanzo|aria-label="Informazioni e assistenza"/);
  assert.match(footer, /aria-label="Informationen und Unterstützung"/);
});
test('home assistance labels are German but form values stay canonical', async () => {
  const html = await (await get('/de/')).text();
  const governance = html.match(/<select[^>]*name="governance"[^>]*>([\s\S]*?)<\/select>/)[1];
  for (const [level, source, label] of [
    [1, 'Assistenza guidata', 'Geführte Unterstützung'],
    [2, 'Coerenza editoriale', 'Redaktionelle Kohärenz'],
    [3, 'Supervisione umana', 'Menschliche Aufsicht'],
    [4, 'Accompagnamento dedicato', 'Persönliche Begleitung']
  ]) assert.ok(governance.includes(`value="Livello ${level} · ${source}">Stufe ${level} · ${label}</option>`));
  assert.ok(html.includes('Konto, Projekte, Kapitel und Interviews werden in der Splendoria-Infrastruktur gespeichert;'));
});
test('save troubleshooting sentence is translated as a complete phrase', async () => {
  const html = await (await get('/de/guida')).text();
  assert.ok(html.includes('Prüfe deine Verbindung und wähle „Meine Änderungen speichern“. Schließe die Seite erst, wenn die Bestätigung erscheint.'));
  assert.doesNotMatch(html, /Verifica la connessione|Speichern le mie modifiche/);
});
for (const [route, day] of [['privacy-policy', 29], ['cookie-policy', 29], ['termini-condizioni', 12], ['note-legali', 12], ['trasparenza-ai', 12]]) test('published date changes format, not its value: ' + route, async () => {
  const html = await (await get('/de/' + route)).text();
  assert.ok(html.includes(`Zuletzt aktualisiert: ${day}. August 2026`));
  assert.doesNotMatch(html, /Zuletzt aktualisiert:.*agosto/);
});
