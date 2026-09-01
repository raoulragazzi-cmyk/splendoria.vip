from pathlib import Path
p=Path('src/worker.js')
s=p.read_text(encoding='utf-8')

old1="if (card.classList.contains('is-active') && navigatorTitle) navigatorTitle.textContent = 'Capitolo ' + (index + 1) + ' di ' + totalChapterCount + ' \\xB7 ' + title;"
new1="if (card.classList.contains('is-active') && navigatorTitle) navigatorTitle.textContent = title;"
old2="if (navigatorTitle) navigatorTitle.textContent = 'Capitolo ' + (activeIndex + 1) + ' di ' + totalChapterCount + ' \\xB7 ' + title;"
new2="if (navigatorTitle) navigatorTitle.textContent = title;"
for old,new in [(old1,new1),(old2,new2)]:
    if old in s:
        s=s.replace(old,new,1)
    elif new not in s:
        raise SystemExit('chapter navigator title expression not found')

old_asset='/assets/studio.js?v=20260901-4'
new_asset='/assets/studio.js?v=20260901-5'
if old_asset in s:
    s=s.replace(old_asset,new_asset,1)
elif new_asset not in s:
    raise SystemExit('studio asset version not found')

checks={
 'active header title only':new1 in s,
 'navigator header title only':new2 in s,
 'old count header removed':"navigatorTitle.textContent = 'Capitolo ' +" not in s,
 'cache bust':new_asset in s,
}
print(checks)
failed=[k for k,v in checks.items() if not v]
if failed: raise SystemExit('guardrails failed: '+', '.join(failed))
p.write_text(s,encoding='utf-8')
