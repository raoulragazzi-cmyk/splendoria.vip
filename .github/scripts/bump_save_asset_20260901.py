from pathlib import Path
p=Path('src/worker.js')
s=p.read_text(encoding='utf-8')
old='/assets/studio.js?v=20260901-1'
new='/assets/studio.js?v=20260901-2'
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit('studio asset version target not found')
p.write_text(s,encoding='utf-8')
print({'cache_bust': new in s, 'online_status': 'Salvato online nel tuo account' in s, 'keepalive': 'keepalive: true' in s})
