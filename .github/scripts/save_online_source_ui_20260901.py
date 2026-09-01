from pathlib import Path

worker_path = Path('src/worker.js')
studio_path = Path('src/studio-worker.js')
w = worker_path.read_text(encoding='utf-8')
s = studio_path.read_text(encoding='utf-8')

# 1) Manual project save: enforce ownership in the UPDATE itself, not only in pre-check.
old_manual = '''await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=?').bind(clean(f.title, 160), clean(f.tone, 80), clean(f.audience, 160), normalizeTargetPages(f.targetPages), clean(f.sourceMaterial, 12e3), clean(f.story, 7e3), clean(f.people, 4e3), clean(f.events, 4e3), clean(f.message, 3e3), now, now, id).run();'''
new_manual = '''await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=? AND userId=?').bind(clean(f.title, 160), clean(f.tone, 80), clean(f.audience, 160), normalizeTargetPages(f.targetPages), clean(f.sourceMaterial, 12e3), clean(f.story, 7e3), clean(f.people, 4e3), clean(f.events, 4e3), clean(f.message, 3e3), now, now, id, user.id).run();'''
if old_manual in w:
    w = w.replace(old_manual, new_manual, 1)
elif new_manual not in w:
    raise SystemExit('manual save ownership patch target not found')

# 2) Project autosave: keep request alive during tab/page transitions.
old_auto = "fetch(String(projectForm.getAttribute('action') || '').replace('/salva', '/autosalva-progetto'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });"
new_auto = "fetch(String(projectForm.getAttribute('action') || '').replace('/salva', '/autosalva-progetto'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data), keepalive: true });"
if old_auto in w:
    w = w.replace(old_auto, new_auto, 1)
elif new_auto not in w:
    raise SystemExit('project autosave fetch patch target not found')

# 3) Make online/server persistence explicit in UI status.
w = w.replace("Ricordi al sicuro \\xB7 Salvato alle ", "Salvato online nel tuo account \\xB7 ", 1)
w = w.replace("Salvataggio automatico dei ricordi attivo", "Salvataggio online automatico attivo nel tuo account", 1)

# 4) Source material UI: +2 type and natural full-width wrapping.
marker = '/* spl-source-material-readable-v1 */'
if marker not in s:
    css = '''\n/* spl-source-material-readable-v1 */\n.studio-editor-page .source-material-panel>p.muted{max-width:none!important;width:100%!important;font-size:calc(var(--studio-type-body) + 2px)!important;line-height:1.55!important}\n.studio-editor-page .source-material-panel .field{width:100%!important;max-width:none!important}\n.studio-editor-page .source-material-panel textarea[name="sourceMaterial"]{display:block!important;width:100%!important;max-width:none!important;font-size:calc(var(--studio-type-reading) + 2px)!important;line-height:1.62!important;white-space:pre-wrap!important;overflow-wrap:break-word!important;word-break:normal!important}\n'''
    anchor = '\n`;' 
    pos = s.find(anchor)
    if pos < 0:
        raise SystemExit('STUDIO_CSS closing anchor not found')
    s = s[:pos] + css + s[pos:]

checks = {
    'manual save user isolation': 'WHERE id=? AND userId=?' in w and 'id, user.id).run();' in w,
    'autosave keepalive': "autosalva-progetto'), { method: 'POST'" in w and 'keepalive: true' in w,
    'online save status': 'Salvato online nel tuo account' in w,
    'source description full width': '.source-material-panel>p.muted{max-width:none!important' in s,
    'source textarea +2': 'textarea[name="sourceMaterial"]' in s and 'calc(var(--studio-type-reading) + 2px)' in s,
    'source wrapping': 'overflow-wrap:break-word!important' in s,
}
print(checks)
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Guardrails failed: ' + ', '.join(failed))

worker_path.write_text(w, encoding='utf-8')
studio_path.write_text(s, encoding='utf-8')
