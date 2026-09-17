import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildGermanDictationCandidate, GERMAN_DICTATION_CSS } from '../src/studio-dictation-de-ux.js';

// In a checkout this extracts the REAL controller from src/worker.js, not a second implementation.
const worker = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
const start = worker.indexOf('const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;');
const end = worker.indexOf("document.querySelectorAll('textarea[data-word-count]')", start);
assert.ok(start >= 0 && end > start, 'canonical controller is present');
const decoded = vm.runInNewContext('`' + worker.slice(start, end) + '`');
const baseline = decoded.replace(
  "const message = key => (languageMessages[selectedLanguage()] || languageMessages['it-IT'])[key];",
  "const message = key => (languageMessages['de-DE'] || languageMessages['it-IT'])[key];"
) + "document.querySelectorAll('textarea[data-word-count]');";
const candidate = buildGermanDictationCandidate(baseline);
assert.equal(candidate.applied, true, candidate.reason);
new vm.Script(candidate.source);

function harness(source = candidate.source, { supported = true, storedLanguage = null } = {}) {
  const state = { requests: [], starts: 0, stops: 0, instances: 0, recognition: null, startError: null, ending: null, styles: [] };
  const classes = () => { const s = new Set(); return { add: x => s.add(x), contains: x => s.has(x), toggle: (x, flag) => flag ? s.add(x) : s.delete(x) }; };
  const node = () => ({ id: '', textContent: '', attrs: {}, classList: classes(), setAttribute(k, v) { this.attrs[k] = v; } });
  const targets = Object.fromEntries(['a','b'].map(id => [id, { id, value: id === 'a' ? 'Vorgeschichte A.' : 'Vorgeschichte B.', inputs: 0, focused: 0, dispatchEvent() { this.inputs++; }, focus() { this.focused++; } }]));
  const statuses = [node(), node()];
  const buttons = ['a','b'].map((id, i) => ({ ...node(), dataset: { voiceTarget: id }, disabled: false, events: {}, parentElement: { querySelector: () => statuses[i] }, addEventListener(k, fn) { this.events[k] = fn; }, click() { if (!this.disabled) this.events.click?.(); } }));
  const select = { value: 'de-DE', events: {}, querySelector: () => ({}), addEventListener(k, fn) { this.events[k] = fn; }, change(value) { this.value = value; this.events.change(); } };
  class Recognition {
    constructor() { state.instances++; state.recognition = this; }
    start() { if (state.startError) throw state.startError; state.starts++; this.onstart?.(); }
    stop() { state.stops++; state.ending = this.onend?.(); }
  }
  const document = {
    querySelector: s => s === '[data-voice-language]' ? select : null,
    querySelectorAll: s => s === '[data-voice-target]' ? buttons : [],
    getElementById: id => targets[id] || state.styles.find(s => s.id === id) || null,
    createElement: () => node(), head: { append: n => state.styles.push(n) },
    body: { classList: { contains: c => c === 'studio-editor-page' } }
  };
  vm.runInNewContext(source, {
    document, window: supported ? { SpeechRecognition: Recognition } : {},
    localStorage: { getItem: () => storedLanguage, setItem() {} }, Event: class {},
    fetch: (url, options) => new Promise((resolve, reject) => state.requests.push({ url, body: JSON.parse(options.body), resolve, reject }))
  });
  return {
    state, targets, buttons, statuses, select,
    result(text, final = true) { const r = [{ transcript: text }]; r.isFinal = final; state.recognition.onresult({ resultIndex: 0, results: [r] }); },
    end() { return state.recognition.onend(); },
    resolve(index, text, ok = true) { state.requests[index].resolve({ ok, json: async () => ({ text }) }); }
  };
}

test('baseline reproduces the cross-field asynchronous overwrite', async () => {
  const h = harness(baseline); h.buttons[0].click(); h.result('erster text'); const pending = h.end();
  h.buttons[1].click(); h.resolve(0, 'Erster Text.'); await pending;
  assert.equal(h.targets.a.value, 'Vorgeschichte B. Erster Text.');
});
test('candidate retains the completed session base text across fields', async () => {
  const h = harness(); h.buttons[0].click(); h.result('erster text'); const pending = h.end();
  h.buttons[1].click(); h.resolve(0, 'Erster Text.'); await pending;
  assert.equal(h.targets.a.value, 'Vorgeschichte A. Erster Text.');
  assert.equal(h.targets.b.value, 'Vorgeschichte B.'); assert.equal(h.targets.a.focused, 0);
  assert.match(h.statuses[0].textContent, /Diktat beendet/); assert.equal(h.buttons[1].attrs['aria-pressed'], 'true');
});
test('old correction cannot overwrite an unchanged but restarted target or its active state', async () => {
  const h = harness(); h.buttons[0].click(); h.result('erster text'); const pending = h.end();
  const raw = h.targets.a.value; h.buttons[0].click(); h.resolve(0, 'Veraltete Korrektur.'); await pending;
  assert.equal(h.targets.a.value, raw); assert.equal(h.buttons[0].attrs['aria-pressed'], 'true'); assert.equal(h.targets.a.focused, 0);
});
test('language change after speaking cannot relabel the completed audio', async () => {
  const h = harness(); h.buttons[0].click(); h.result('ein deutscher Satz'); h.select.change('it-IT');
  assert.equal(h.state.requests[0].body.language, 'de-DE');
  h.resolve(0, 'Ein deutscher Satz.'); await h.state.ending;
});
test('manual edit while correction is pending is not overwritten', async () => {
  const h = harness(); h.buttons[0].click(); h.result('Text'); const pending = h.end();
  h.targets.a.value = 'Manuelle Fassung'; h.resolve(0, 'Alte Fassung'); await pending;
  assert.equal(h.targets.a.value, 'Manuelle Fassung');
});
test('start and stop labels have explicit accessible states', async () => {
  const h = harness(); assert.equal(h.buttons[0].textContent, 'Diktat starten'); h.buttons[0].click();
  assert.equal(h.buttons[0].textContent, 'Diktat beenden'); assert.equal(h.buttons[0].attrs['aria-controls'], 'a');
  assert.equal(h.statuses[0].attrs['aria-live'], 'polite');
  assert.equal(h.buttons[0].attrs['aria-describedby'], h.statuses[0].id);
  h.buttons[0].click(); await h.state.ending; assert.equal(h.buttons[0].textContent, 'Diktat starten');
});
test('no speech performs no correction call and preserves text', async () => {
  const h = harness(); h.buttons[0].click(); await h.end(); assert.equal(h.state.requests.length, 0); assert.equal(h.targets.a.value, 'Vorgeschichte A.');
});
test('HTTP correction failure keeps the original transcript without claiming saved', async () => {
  const h = harness(); h.buttons[0].click(); h.result('Mein Text'); const pending = h.end(); h.resolve(0, '', false); await pending;
  assert.equal(h.targets.a.value, 'Vorgeschichte A. Mein Text'); assert.match(h.statuses[0].textContent, /vor dem Speichern/);
});
test('network failure preserves transcript and finishes state', async () => {
  const h = harness(); h.buttons[0].click(); h.result('Mein Text'); const pending = h.end(); h.state.requests[0].reject(new Error('offline')); await pending;
  assert.equal(h.targets.a.value, 'Vorgeschichte A. Mein Text'); assert.equal(h.buttons[0].attrs['aria-pressed'], 'false');
});
test('synchronous browser start failure is recoverable and does not lock the next attempt', () => {
  const h = harness(); h.state.startError = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
  assert.doesNotThrow(() => h.buttons[0].click()); assert.match(h.statuses[0].textContent, /Mikrofonzugriff/);
  h.state.startError = null; h.buttons[0].click(); assert.equal(h.state.starts, 1);
});
test('permission denial performs no AI correction and retains recognized text', async () => {
  const h = harness(); h.buttons[0].click(); h.result('Mein Text'); h.state.recognition.onerror({ error: 'not-allowed' }); await h.end();
  assert.equal(h.state.requests.length, 0); assert.equal(h.targets.a.value, 'Vorgeschichte A. Mein Text'); assert.match(h.statuses[0].textContent, /Mikrofonzugriff/);
});
test('missing browser support retains an explicit alternative', () => {
  const h = harness(candidate.source, { supported: false }); assert.equal(h.buttons[0].disabled, true); assert.match(h.statuses[0].textContent, /tippen/); assert.equal(h.state.instances, 0);
});
test('single recognizer and automatic correction endpoint remain unchanged', () => {
  const h = harness(); assert.equal(h.state.instances, 1); assert.equal((candidate.source.match(/new SpeechRecognition\(\)/g) || []).length, 1); assert.ok(candidate.source.includes("fetch('/api/musa/trascrizione'"));
});
test('UI remains German with an intentionally Italian recognition preference', () => {
  const h = harness(candidate.source, { storedLanguage: 'it-IT' }); h.buttons[0].click(); assert.equal(h.state.recognition.lang, 'it-IT'); assert.match(h.statuses[0].textContent, /Mikrofon/);
});
test('Italian and English assets are returned byte-for-byte unchanged', () => {
  for (const lang of ['it', 'en']) assert.equal(buildGermanDictationCandidate(baseline, lang).source, baseline);
});
test('transform is idempotent', () => { assert.equal(buildGermanDictationCandidate(candidate.source).source, candidate.source); });
test('structural drift returns the complete unchanged baseline, never a partial patch', () => {
  const drift = baseline.replace('recognition.start();', 'recognition.startWithNewAPI();'); const result = buildGermanDictationCandidate(drift);
  assert.equal(result.applied, false); assert.equal(result.source, drift);
});
test('missing or duplicate controller is rejected without modifying the asset', () => {
  for (const source of ['no controller', baseline + baseline]) { const result = buildGermanDictationCandidate(source); assert.equal(result.applied, false); assert.equal(result.source, source); }
});
test('reading CSS is scoped to Studio and includes 48px controls, wrapping and focus', () => {
  assert.match(GERMAN_DICTATION_CSS, /min-height:48px/); assert.match(GERMAN_DICTATION_CSS, /font-size:16px/); assert.match(GERMAN_DICTATION_CSS, /max-width:640px/); assert.match(GERMAN_DICTATION_CSS, /:focus-visible/);
  assert.equal(harness().state.styles.length, 1);
});
test('button text contrast exceeds WCAG AA minimum in idle and listening states', () => {
  const lum = hex => { const [r,g,b] = hex.match(/../g).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4); return .2126*r+.7152*g+.0722*b; };
  for (const background of ['075d56', '873820']) assert.ok(1.05/(lum(background)+.05) >= 4.5);
});
