from pathlib import Path

worker_path = Path('src/worker.js')
worker = worker_path.read_text(encoding='utf-8')
old_empty = '${cards || `<article class="card"><h3>La tua storia comincia qui</h3><p>Imposta il libro in meno di due minuti. Potrai cambiare tutto in seguito.</p></article>`}'
if worker.count(old_empty) != 1:
    raise SystemExit(f'empty-state guard failed: {worker.count(old_empty)} matches')
worker = worker.replace(old_empty, '${cards}', 1)
old_open = '<div class="card" style="margin-top:24px"><h3>Crea un nuovo libro</h3><form method="post" action="/nuovo-libro"><div class="grid three"><label class="field">Titolo provvisorio<input name="title" placeholder="La mia storia" required></label><label class="field">Genere'
new_open = '<div class="card" style="margin-top:24px"><h3>${firstProject ? "La tua storia comincia qui" : "Crea un nuovo libro"}</h3>${firstProject ? `<p>Imposta il libro in meno di due minuti. Potrai cambiare tutto in seguito.</p>` : ""}<form method="post" action="/nuovo-libro"${firstProject ? ` data-first-book` : ""}><div class="grid three"><label class="field">Titolo provvisorio<input name="title" ${firstProject ? `value="La mia storia"` : `placeholder="La mia storia"`} required></label>${firstProject ? `<details class="first-book-options"><summary>Personalizza genere e struttura</summary><div class="grid two">` : ""}<label class="field">Genere'
if worker.count(old_open) != 1:
    raise SystemExit(f'first-book opening guard failed: {worker.count(old_open)} matches')
worker = worker.replace(old_open, new_open, 1)
old_close = '<option value="117">18 capitoli \\xB7 circa 6\\u20137 pagine ciascuno</option></select></label></div><p class="small muted">Entrambe le strutture producono un libro fra 80 e 120 pagine effettive, compresi frontespizio e indice. ${firstProject ? "La prova gratuita vale per questo primo progetto." : "La prova gratuita \\xE8 unica per account; per un altro progetto potrai scegliere la formula prima di usare la Musa."}</p><button class="button">${firstProject ? "Crea il progetto gratuito" : "Crea un altro progetto"}</button>'
new_close = '<option value="117">18 capitoli \\xB7 circa 6\\u20137 pagine ciascuno</option></select></label>${firstProject ? `</div><div data-first-book-language-slot></div></details>` : ""}</div><p class="small muted">Entrambe le strutture producono un libro fra 80 e 120 pagine effettive, compresi frontespizio e indice. ${firstProject ? "La prova gratuita vale per questo primo progetto." : "La prova gratuita \\xE8 unica per account; per un altro progetto potrai scegliere la formula prima di usare la Musa."}</p><button class="button">${firstProject ? "Inizia il mio libro" : "Crea un altro progetto"}</button>'
if worker.count(old_close) != 1:
    raise SystemExit(f'first-book closing guard failed: {worker.count(old_close)} matches')
worker = worker.replace(old_close, new_close, 1)
worker_path.write_text(worker, encoding='utf-8')

lang_path = Path('src/studio-language-worker.js')
lang = lang_path.read_text(encoding='utf-8')
old_fn = '''function injectNewBookControls(html, ui) {
  if (html.includes("data-book-language-panel")) return html;
  const formPattern = /(<form method="post" action="\\/(?:de\\/|en\\/)?nuovo-libro">[\\s\\S]*?<div class="grid three">[\\s\\S]*?<\\/div>)(<p class="small muted">)/;
  return html.replace(formPattern, `$1${newBookLanguagePanel(ui)}$2`);
}'''
new_fn = '''function injectNewBookControls(html, ui) {
  if (html.includes("data-book-language-panel")) return html;
  const panel = newBookLanguagePanel(ui);
  const firstBookSlot = '<div data-first-book-language-slot></div>';
  if (html.includes(firstBookSlot)) return html.replace(firstBookSlot, panel);
  const formPattern = /(<form method="post" action="\\/(?:de\\/|en\\/)?nuovo-libro">[\\s\\S]*?<div class="grid three">[\\s\\S]*?<\\/div>)(<p class="small muted">)/;
  return html.replace(formPattern, `$1${panel}$2`);
}'''
if lang.count(old_fn) != 1:
    raise SystemExit(f'language injector guard failed: {lang.count(old_fn)} matches')
lang_path.write_text(lang.replace(old_fn, new_fn, 1), encoding='utf-8')

client_path = Path('src/i18n-client-worker.js')
client = client_path.read_text(encoding='utf-8')
pairs = {
    '["Crea il progetto gratuito", "Kostenloses Projekt erstellen"],': '["Personalizza genere e struttura", "Genre und Struktur anpassen"],\n    ["Inizia il mio libro", "Mein Buch beginnen"],\n    ["Crea il progetto gratuito", "Kostenloses Projekt erstellen"],',
    '["Crea il progetto gratuito", "Create free project"],': '["Personalizza genere e struttura", "Customise genre and structure"],\n    ["Inizia il mio libro", "Start my book"],\n    ["Crea il progetto gratuito", "Create free project"],'
}
for source, target in pairs.items():
    if client.count(source) != 1:
        raise SystemExit(f'i18n client guard failed for {source!r}: {client.count(source)} matches')
    client = client.replace(source, target, 1)
client_path.write_text(client, encoding='utf-8')

styles_path = Path('src/styles.js')
styles = styles_path.read_text(encoding='utf-8')
anchor = '.studio{padding:46px 0 80px}'
addition = '.first-book-options{grid-column:1/-1;margin:2px 0 4px;border:1px solid var(--line);border-radius:16px;padding:14px 16px;background:#f8fbf9}.first-book-options>summary{cursor:pointer;font-weight:800;color:var(--teal-dark)}.first-book-options[open]>summary{margin-bottom:12px}.first-book-options .grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.first-book-options [data-book-language-panel]{margin-top:14px}@media(max-width:720px){.first-book-options .grid.two{grid-template-columns:1fr}}'
if styles.count(anchor) != 1 or 'first-book-options{' in styles:
    raise SystemExit('styles guard failed')
styles_path.write_text(styles.replace(anchor, addition + '\n' + anchor, 1), encoding='utf-8')

test_path = Path('test/i18n-client-smoke.mjs')
test = test_path.read_text(encoding='utf-8')
replacements = {
    'studio: ["Mein Studio", "Hallo, Anna", "Hier kannst du deine Bücher selbstständig erstellen", "Neues Buch erstellen", "Arbeitstitel", "Kostenloses Projekt erstellen"],': 'studio: ["Mein Studio", "Hallo, Anna", "Hier kannst du deine Bücher selbstständig erstellen", "Deine Geschichte beginnt hier", "Arbeitstitel", "Genre und Struktur anpassen", "Mein Buch beginnen"],',
    'studio: ["My Studio", "Hello, Anna", "Here you can create, edit and complete your books independently", "Create a new book", "Working title", "Create free project"],': 'studio: ["My Studio", "Hello, Anna", "Here you can create, edit and complete your books independently", "Your story starts here", "Working title", "Customise genre and structure", "Start my book"],'
}
for source, target in replacements.items():
    if test.count(source) != 1:
        raise SystemExit(f'i18n smoke expectation guard failed: {source[:40]}... count={test.count(source)}')
    test = test.replace(source, target, 1)
test_path.write_text(test, encoding='utf-8')

print('first-book progressive onboarding patch prepared')
