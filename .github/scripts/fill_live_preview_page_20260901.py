from pathlib import Path
p=Path('src/worker.js')
s=p.read_text(encoding='utf-8')

old='var LIVE_PREVIEW_WORDS_PER_PAGE = 200;\nvar LIVE_PREVIEW_FIRST_PAGE_WORDS = 150;'
new='var LIVE_PREVIEW_WORDS_PER_PAGE = 220;\nvar LIVE_PREVIEW_FIRST_PAGE_WORDS = 220;'
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit('live preview word limits not found')

old_asset='/assets/studio.js?v=20260901-2'
new_asset='/assets/studio.js?v=20260901-3'
if old_asset in s:
    s=s.replace(old_asset,new_asset,1)
elif new_asset not in s:
    raise SystemExit('studio asset version not found')

checks={
 'first page uses full A5 estimate':'LIVE_PREVIEW_FIRST_PAGE_WORDS = 220' in s,
 'following pages aligned':'LIVE_PREVIEW_WORDS_PER_PAGE = 220' in s,
 'cache bust':new_asset in s,
 'print estimate unchanged':'PRINT_WORDS_PER_PAGE = 220' in s,
}
print(checks)
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('guardrails failed: '+', '.join(failed))
p.write_text(s,encoding='utf-8')
