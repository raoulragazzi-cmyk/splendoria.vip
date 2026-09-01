from pathlib import Path
p=Path('src/worker.js')
s=p.read_text(encoding='utf-8')

old='var PRINT_WORDS_PER_PAGE = 220;\nvar LIVE_PREVIEW_WORDS_PER_PAGE = 220;\nvar LIVE_PREVIEW_FIRST_PAGE_WORDS = 220;'
new='var PRINT_WORDS_PER_PAGE = 350;\nvar LIVE_PREVIEW_WORDS_PER_PAGE = 350;\nvar LIVE_PREVIEW_FIRST_PAGE_WORDS = 350;'
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit('word-per-page constants not found')

old_asset='/assets/studio.js?v=20260901-3'
new_asset='/assets/studio.js?v=20260901-4'
if old_asset in s:
    s=s.replace(old_asset,new_asset,1)
elif new_asset not in s:
    raise SystemExit('studio asset version not found')

checks={
 'print estimate 350':'PRINT_WORDS_PER_PAGE = 350' in s,
 'first preview page 350':'LIVE_PREVIEW_FIRST_PAGE_WORDS = 350' in s,
 'following preview pages 350':'LIVE_PREVIEW_WORDS_PER_PAGE = 350' in s,
 'cache bust':new_asset in s,
}
print(checks)
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('guardrails failed: '+', '.join(failed))
p.write_text(s,encoding='utf-8')
