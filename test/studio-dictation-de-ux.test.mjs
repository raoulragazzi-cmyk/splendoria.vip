import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createDictationHarness } from './helpers/dictation-harness.mjs';
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

const harness = (source = candidate.source, options) => createDictationHarness(source, options);

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

// DE-04: browser events, not just assignments while a fetch awaits.
test('baseline overwrites a manual edit during listening', () => {
  const h = harness(baseline); h.buttons[0].click(); h.result('Text', false);
  h.edit('a', 'Meine Änderung'); h.result('Späteres Ergebnis');
  assert.notEqual(h.targets.a.value, 'Meine Änderung');
});
for (const [name, value] of [['typing', 'Meine Änderung'], ['deletion', ''], ['paste and newlines', '  Äpfel\nÖl\n\nGrüße  ']]) {
  test('manual ' + name + ' during listening survives late results and end', async () => {
    const h = harness(candidate.source, { delayedEnd: true }); h.buttons[0].click(); h.result('Zwischentext', false);
    h.edit('a', value); assert.equal(h.state.stops, 1);
    h.result('Verspäteter Text'); await h.end();
    assert.equal(h.targets.a.value, value); assert.equal(h.state.requests.length, 0);
    assert.equal(h.targets.a.focused, 0); assert.match(h.statuses[0].textContent, /Änderungen bleiben erhalten/);
    assert.equal(h.buttons[0].attrs['aria-pressed'], 'false');
    assert.equal(h.targets.a.listeners.input.size, 0);
  });
}
test('programmatic changes without input events are preserved before result and before end', async () => {
  for (const lateResult of [false, true]) {
    const h = harness(candidate.source, { delayedEnd: true }); h.buttons[0].click(); h.result('Text', false);
    h.targets.a.value = 'Externe Änderung'; if (lateResult) h.result('Später Text'); await h.end();
    assert.equal(h.targets.a.value, 'Externe Änderung'); assert.equal(h.state.requests.length, 0);
  }
});
test('composition start protects an IME edit before its first character arrives', async () => {
  const h = harness(candidate.source, { delayedEnd: true }); h.buttons[0].click(); h.result('Text', false);
  h.edit('a', h.targets.a.value, 'compositionstart'); h.result('late'); h.edit('a', 'Schöne Grüße'); await h.end();
  assert.equal(h.targets.a.value, 'Schöne Grüße'); assert.equal(h.state.requests.length, 0);
});
test('own dictation input events do not stop recognition or accumulate listeners', async () => {
  const h = harness();
  for (let i = 0; i < 3; i++) {
    h.buttons[0].click(); h.result('Text'); assert.equal(h.state.stops, 0);
    const pending = h.end(); h.resolve(i, 'Text.'); await pending;
    assert.equal(h.targets.a.listeners.input.size, 0);
  }
});
test('manual edit before onstart remains protected when stop initially throws', async () => {
  const h = harness(candidate.source, { delayedStart: true, delayedEnd: true }); h.buttons[0].click();
  h.state.stopError = new Error('not started yet');
  assert.doesNotThrow(() => h.edit('a', 'Schon bearbeitet'));
  h.state.stopError = null; h.state.recognition.onstart();
  assert.ok(h.state.stops >= 2); h.result('late'); await h.end();
  assert.equal(h.targets.a.value, 'Schon bearbeitet'); assert.equal(h.state.requests.length, 0);
});
test('duplicate stop clicks while browser is ending do not throw', async () => {
  const h = harness(candidate.source, { delayedStart: true, delayedEnd: true }); h.buttons[0].click();
  h.state.stopError = new Error('already ending');
  assert.doesNotThrow(() => { h.buttons[0].click(); h.buttons[0].click(); });
  h.state.stopError = null; await h.end();
});
test('no speech preserves whitespace exactly and does not emit a save-triggering input', async () => {
  const h = harness(); h.targets.a.value = '  Absatz\n\n  '; h.buttons[0].click(); await h.end();
  assert.equal(h.targets.a.value, '  Absatz\n\n  '); assert.equal(h.targets.a.inputs, 0);
});
test('new dictation after manual edit starts from the edited text', async () => {
  const h = harness(); h.buttons[0].click(); h.edit('a', 'Meine Änderung'); await h.state.ending;
  h.buttons[0].click(); h.result('Fortsetzung'); const pending = h.end(); h.resolve(0, 'Fortsetzung.'); await pending;
  assert.equal(h.targets.a.value, 'Meine Änderung Fortsetzung.');
});
// DE-05: saved book preference is authoritative; language UI remains independent.
test('saved German book dictation preference wins over an older Italian browser preference', () => {
  const h = harness(candidate.source, { bookLanguage: 'de-DE', storedLanguage: 'it-IT' }); h.buttons[0].click();
  assert.equal(h.state.recognition.lang, 'de-DE');
});
test('saved Italian book dictation is not forced to German by the UI or browser', () => {
  const h = harness(candidate.source, { bookLanguage: 'it-IT', storedLanguage: 'de-DE' }); h.buttons[0].click();
  assert.equal(h.state.recognition.lang, 'it-IT'); assert.match(h.statuses[0].textContent, /Mikrofon/);
});
// DE-06: result slots identify duplicates; textual similarity does not.
test('baseline collapses distinct repeated or umlaut-different result slots', () => {
  for (const words of [['ja', 'ja'], ['schon', 'schön']]) {
    const h = harness(baseline); h.buttons[0].click(); h.results(words.map(text => [text, true]));
    assert.notEqual(h.targets.a.value, 'Vorgeschichte A. ' + words.join(' '));
  }
});
for (const phrase of [['ja', 'ja'], ['schon', 'schön'], ['Masse', 'Maße'], ['Es war schön', 'schön war es']]) {
  test('distinct result slots preserve ' + phrase.join(' / '), () => {
    const h = harness(); h.buttons[0].click(); h.results(phrase.map(text => [text, true]));
    assert.equal(h.targets.a.value, 'Vorgeschichte A. ' + phrase.join(' '));
  });
}
test('repeated event and cumulative result list do not duplicate text', () => {
  const h = harness(); h.buttons[0].click(); h.results([['Hallo', true]]);
  h.results([['Hallo', true]]); h.results([['Hallo', true], ['Welt', false]], 1);
  h.results([['Hallo', true], ['Welt', true]], 1);
  assert.equal(h.targets.a.value, 'Vorgeschichte A. Hallo Welt');
});
test('shrinking interim list removes only the obsolete hypothesis', () => {
  const h = harness(); h.buttons[0].click(); h.results([['Grüße', true], ['aus Berlin', false]]);
  h.results([['Grüße', true]], 1); assert.equal(h.targets.a.value, 'Vorgeschichte A. Grüße');
});
test('empty interim result returns exact original text without sending AI', async () => {
  const h = harness(); h.targets.a.value = '  Anfang\n\n'; h.buttons[0].click(); h.results([['vielleicht', false]]);
  h.results([], 0); await h.end(); assert.equal(h.targets.a.value, '  Anfang\n\n'); assert.equal(h.state.requests.length, 0);
});

test('edit then undo while correction waits still invalidates the older response', async () => {
  const h = harness(); h.buttons[0].click(); h.result('Text'); const pending = h.end(); const committed = h.targets.a.value;
  h.edit('a', 'Zwischenfassung'); h.edit('a', committed); h.resolve(0, 'Alte Korrektur'); await pending;
  assert.equal(h.targets.a.value, committed); assert.equal(h.targets.a.listeners.input.size, 0);
});
test('a correction response cannot steal focus from another control', async () => {
  const h = harness(); h.document.activeElement = h.buttons[0]; h.buttons[0].click(); h.result('Text'); const pending = h.end();
  h.document.activeElement = h.targets.b; h.resolve(0, 'Text.'); await pending; assert.equal(h.targets.a.focused, 0);
});
for (const invalid of [{ unexpected: 'object' }, '   ', 42]) test('malformed correction text is ignored: ' + JSON.stringify(invalid), async () => {
  const h = harness(); h.buttons[0].click(); h.result('Text'); const pending = h.end(); const committed = h.targets.a.value;
  h.resolve(0, invalid); await pending; assert.equal(h.targets.a.value, committed);
});
