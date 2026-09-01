from pathlib import Path

p = Path('src/worker.js')
s = p.read_text(encoding='utf-8')

old_copy = 'Scegli \\u201CSalva come PDF\\u201D, scala 100% e disattiva intestazioni e pi\\xE8 di pagina del browser.'
new_copy = 'Scegli \\u201CSalva come PDF\\u201D e scala 100%. Splendoria esclude automaticamente data, titolo e URL del browser e stampa soltanto la numerazione editoriale delle pagine.'
if old_copy not in s:
    raise SystemExit('print toolbar copy not found')
s = s.replace(old_copy, new_copy, 1)

old_pages = '@page{size:154mm 216mm;margin-top:18mm;margin-bottom:18mm}@page:left{margin-left:8mm;margin-right:18mm}@page:right{margin-left:18mm;margin-right:8mm}@page:first{margin-left:18mm;margin-right:8mm}'
new_pages = '''@page{size:154mm 216mm;margin-top:18mm;margin-bottom:18mm}
@page:left{margin-left:8mm;margin-right:18mm;@bottom-left{content:counter(page);font:400 9pt/1 Garamond,"EB Garamond",Georgia,serif;color:#171d1b}}
@page:right{margin-left:18mm;margin-right:8mm;@bottom-right{content:counter(page);font:400 9pt/1 Garamond,"EB Garamond",Georgia,serif;color:#171d1b}}
@page:first{margin:0}'''
if old_pages not in s:
    raise SystemExit('book @page rules not found')
s = s.replace(old_pages, new_pages, 1)

old_title_print = '.book-title-page{min-height:180mm;break-after:right}'
new_title_print = '.book-title-page{position:relative;box-sizing:border-box;width:154mm;height:216mm;min-height:216mm;margin:0;padding:18mm 8mm 18mm 18mm;break-after:right}.book-title-page::after{content:"1";position:absolute;right:8mm;bottom:6mm;font:400 9pt/1 Garamond,"EB Garamond",Georgia,serif;color:#171d1b}'
if old_title_print not in s:
    raise SystemExit('title page print rule not found')
s = s.replace(old_title_print, new_title_print, 1)

checks = {
    'first page suppresses browser chrome': '@page:first{margin:0}' in s,
    'left page numbers': '@bottom-left{content:counter(page)' in s,
    'right page numbers': '@bottom-right{content:counter(page)' in s,
    'cover page 1': '.book-title-page::after{content:"1"' in s,
    'browser header instruction removed': 'disattiva intestazioni e pi\\xE8 di pagina del browser' not in s,
}
print(checks)
failed = [k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('Guardrails failed: ' + ', '.join(failed))

p.write_text(s, encoding='utf-8')
