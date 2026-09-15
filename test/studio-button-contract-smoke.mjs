import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
const studio = fs.readFileSync(new URL('../src/studio-worker.js', import.meta.url), 'utf8');
const editorI18n = fs.readFileSync(new URL('../src/i18n-editor-safe-worker.js', import.meta.url), 'utf8');
const studioLanguage = fs.readFileSync(new URL('../src/studio-language-worker.js', import.meta.url), 'utf8');

function has(source, fragment, label = fragment) {
  assert.ok(source.includes(fragment), `missing button/action contract: ${label}`);
}

// Client-side form destinations: these are the contracts behind every material Studio action.
for (const [fragment, label] of [
  ['/nuovo-libro', 'create book'],
  ['/libro/${id}/salva', 'save book settings'],
  ['/libro/${id}/migliora', 'improve book field'],
  ['/libro/${id}/affidati', 'Muse book field'],
  ['/libro/${id}/struttura', 'create outline'],
  ['/libro/${id}/intervista', 'create interview'],
  ['/libro/${id}/risposte', 'save interview answers'],
  ['/libro/${id}/risposte/migliora', 'improve interview answer'],
  ['/libro/${id}/risposte/affidati', 'Muse interview answer'],
  ['/libro/${id}/capitolo/${c.id}/salva', 'save chapter'],
  ['/libro/${id}/capitolo/${c.id}/genera', 'generate chapter'],
  ['/libro/${id}/capitolo/${c.id}/rifinisci', 'refine chapter'],
  ['/libro/${id}/ripristina', 'restore book'],
  ['/libro/${esc(id)}/elimina', 'delete book'],
  ['/libro/${id}/anteprima', 'book preview']
]) has(worker, fragment, label);

// Refinement buttons must keep their canonical machine values; translated labels must never replace these values.
for (const action of ['improve', 'grammar', 'clarity', 'emotional', 'vivid', 'elegant', 'short']) {
  assert.match(worker, new RegExp(`value=\\\\?"${action}\\\\?"`), `missing canonical refinement action ${action}`);
}

// Buttons that must never submit a form accidentally require explicit type=button semantics.
for (const [pattern, label] of [
  [/<button[^>]*type=\\?"button\\?"[^>]*data-assessment-generate/, 'assessment generate'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-assessment-print/, 'assessment print'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-print-guide/, 'guide print'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-print-book/, 'book print'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-cookie-accept/, 'cookie close/accept'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-voice-target/, 'dictation'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-live-prev/, 'live preview previous'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-live-next/, 'live preview next'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-chapter-previous/, 'chapter previous'],
  [/<button[^>]*type=\\?"button\\?"[^>]*data-chapter-next/, 'chapter next']
]) assert.match(worker, pattern, `${label} must be an explicit non-submit button`);
assert.match(studio, /backToTop\.type\s*=\s*['"]button['"]/, 'back-to-top must be an explicit non-submit button');

// AI convenience controls intentionally bypass unrelated required fields but still submit to their explicit endpoint.
has(worker, 'formnovalidate>\\u2726 Migliora</button>', 'field improve formnovalidate');
has(worker, 'formnovalidate>Affidati alla Musa</button>', 'field Muse formnovalidate');
has(worker, 'formaction=\\"/libro/${id}/capitolo/${c.id}/rifinisci\\" formnovalidate', 'chapter improve formnovalidate');
has(worker, 'formaction=\\"/libro/${id}/capitolo/${c.id}/genera\\" formnovalidate', 'chapter Muse formnovalidate');

// Destructive actions remain protected by canonical confirmation tokens and password confirmation.
has(worker, 'pattern=\\"ELIMINA\\"', 'book deletion token');
has(worker, 'pattern=\\"CANCELLA\\"', 'account deletion token');
assert.match(worker, /action=\\?"\/libro\/\$\{esc\(id\)\}\/elimina\\?"[\s\S]{0,900}name=\\?"password\\?"/, 'book deletion must require current password');

// Localized editor routes must preserve action/formaction semantics rather than invent translated endpoints.
has(editorI18n, '["href", "action", "formaction", "data-book-path"]', 'localized route attribute set');
has(editorI18n, 'out = out.split(\'action="/nuovo-libro"\')', 'localized new-book POST');
has(editorI18n, 'out = out.split(\'action="/esci"\')', 'localized logout POST');
assert.ok(!editorI18n.includes('"/admin"') && !editorI18n.includes('"/area-amministratore"'), 'localized client editor must not expose admin routes');

// Key DE/EN visible button labels are explicitly present while machine values remain canonical.
for (const label of [
  'Diese Erinnerungen sichern', 'Diese Antworten der Muse anvertrauen', 'Die Struktur meines Buches entwerfen',
  'Kapitel diktieren', 'Verbessern', 'Der Muse anvertrauen', 'Meine Änderungen speichern',
  'Neue Version erstellen', 'Grammatik korrigieren', 'Klarer und flüssiger', 'Prägnanter',
  'Safeguard these memories', 'Entrust these answers to the Muse', 'Design my book structure',
  'Dictate the chapter', 'Improve', 'Entrust to the Muse', 'Save my changes',
  'Create a new version', 'Correct grammar', 'Clearer and smoother', 'More concise'
]) has(editorI18n, label, `localized button label: ${label}`);

// Locale switcher is navigation, not a mutation: it preserves current query string and canonical project path.
has(studioLanguage, 'localizedPath(locale, url.pathname) + url.search', 'locale switcher preserves query');
has(studioLanguage, 'data-studio-locale-switcher', 'private Studio locale switcher');
assert.match(studioLanguage, /projectIdFromPath\(pathname\)[\s\S]*canonicalPath\(pathname\)/, 'localized book routes must resolve the canonical project id');

// Dynamic section editor keeps submit semantics for Muse while navigation controls remain JS-only.
has(studio, "sectionMuse.type = 'submit'", 'section Muse submit type');
has(studio, "sectionMuse.name = 'museSection'", 'section Muse canonical field');
has(studio, "sectionMuse.value = String(index)", 'section Muse canonical index');

console.log('studio button/action contract deep-pass: ok');
