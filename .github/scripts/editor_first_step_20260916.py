from pathlib import Path

worker_path = Path('src/worker.js')
worker = worker_path.read_text(encoding='utf-8')
opening = '<h2>Prima delle parole, ci sono i ricordi.</h2><div class="grid three">'
replacement_opening = '<h2>Prima delle parole, ci sono i ricordi.</h2><details class="book-settings-options"><summary>Impostazioni del libro</summary><div class="grid three">'
if worker.count(opening) != 1:
    raise SystemExit(f'editor settings opening guard failed: {worker.count(opening)} matches')
worker = worker.replace(opening, replacement_opening, 1)
closing = '<option value="117"${structure.chapters === 18 ? " selected" : ""}>18 capitoli \\xB7 circa 6\\u20137 pagine ciascuno</option></select></label><div class="source-material-panel">'
replacement_closing = '<option value="117"${structure.chapters === 18 ? " selected" : ""}>18 capitoli \\xB7 circa 6\\u20137 pagine ciascuno</option></select></label><div data-editor-language-slot></div></details><div class="source-material-panel">'
if worker.count(closing) != 1:
    raise SystemExit(f'editor settings closing guard failed: {worker.count(closing)} matches')
worker_path.write_text(worker.replace(closing, replacement_closing, 1), encoding='utf-8')

lang_path = Path('src/studio-language-worker.js')
lang = lang_path.read_text(encoding='utf-8')
old = '''function injectEditorControls(html, ui, pref) {
  if (html.includes("data-book-language-panel")) return setDictationSelection(html, pref.dictationLanguage);
  let out = html.replace(/<form class="wow-panel"(?![^>]*\\bid=)/, '<form class="wow-panel" id="spl-book-settings"');
  out = out.replace(/(<form class="wow-panel"[^>]*>[\\s\\S]*?<h2[^>]*>[\\s\\S]*?<\\/h2>)/, `$1${languagePanel(ui, pref)}`);
  return setDictationSelection(out, pref.dictationLanguage);
}'''
new = '''function injectEditorControls(html, ui, pref) {
  if (html.includes("data-book-language-panel")) return setDictationSelection(html, pref.dictationLanguage);
  let out = html.replace(/<form class="wow-panel"(?![^>]*\\bid=)/, '<form class="wow-panel" id="spl-book-settings"');
  const panel = languagePanel(ui, pref);
  const settingsSlot = '<div data-editor-language-slot></div>';
  if (out.includes(settingsSlot)) out = out.replace(settingsSlot, panel);
  else out = out.replace(/(<form class="wow-panel"[^>]*>[\\s\\S]*?<h2[^>]*>[\\s\\S]*?<\\/h2>)/, `$1${panel}`);
  return setDictationSelection(out, pref.dictationLanguage);
}'''
if lang.count(old) != 1:
    raise SystemExit(f'editor language injector guard failed: {lang.count(old)} matches')
lang_path.write_text(lang.replace(old, new, 1), encoding='utf-8')

safe_path = Path('src/i18n-editor-safe-worker.js')
safe = safe_path.read_text(encoding='utf-8')
for source, target in [
    ("['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Vor den Worten stehen die Erinnerungen.</h2>'],", "['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Vor den Worten stehen die Erinnerungen.</h2>'],\n    ['<summary>Impostazioni del libro</summary>', '<summary>Bucheinstellungen</summary>'],"),
    ("['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Before the words come the memories.</h2>'],", "['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Before the words come the memories.</h2>'],\n    ['<summary>Impostazioni del libro</summary>', '<summary>Book settings</summary>'],")
]:
    if safe.count(source) != 1:
        raise SystemExit(f'editor safe i18n guard failed: {source} count={safe.count(source)}')
    safe = safe.replace(source, target, 1)
safe_path.write_text(safe, encoding='utf-8')

styles_path = Path('src/styles.js')
styles = styles_path.read_text(encoding='utf-8')
anchor = '.wow-panel{background:'
if styles.count(anchor) != 1 or '.book-settings-options{' in styles:
    raise SystemExit('editor settings styles guard failed')
css = '.book-settings-options{margin:20px 0 26px;border:1px solid #c9ddd6;border-radius:18px;background:#f8fbf9;padding:15px 18px}.book-settings-options>summary{cursor:pointer;font-weight:850;color:var(--teal-dark)}.book-settings-options[open]>summary{margin-bottom:12px}.book-settings-options [data-book-language-panel]{margin:18px 0 4px}\n'
styles_path.write_text(styles.replace(anchor, css + anchor, 1), encoding='utf-8')

smoke_path = Path('test/i18n-editor-smoke.mjs')
smoke = smoke_path.read_text(encoding='utf-8')
for source, target in [
    ('"Die Seele des Buches", "Buchstruktur", "Deine Muse"', '"Die Seele des Buches", "Bucheinstellungen", "Buchstruktur", "Deine Muse"'),
    ('"The soul of the book", "Book structure", "Your Muse"', '"The soul of the book", "Book settings", "Book structure", "Your Muse"')
]:
    if smoke.count(source) != 1:
        raise SystemExit(f'i18n editor smoke guard failed: {source} count={smoke.count(source)}')
    smoke = smoke.replace(source, target, 1)
smoke_path.write_text(smoke, encoding='utf-8')

print('editor first-step focus patch prepared')
