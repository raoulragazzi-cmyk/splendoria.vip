from pathlib import Path

studio_path = Path('src/studio-worker.js')
s = studio_path.read_text(encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)

old_start = """const STUDIO_JS_PATCH = String.raw`\n;(() => {\n  if (!document.body || !document.body.classList.contains('studio-editor-page')) return;\n  if (document.documentElement.dataset.splNotesPatch === '1') return;"""
new_start = """const STUDIO_JS_PATCH = String.raw`\n;(() => {\n  const COOKIE_NOTICE_KEY = 'splendoria-cookie-notice-v2';\n  const privacyBanner = document.querySelector('[data-cookie-banner]');\n  const hidePrivacyBanner = () => {\n    if (!privacyBanner) return;\n    try { localStorage.setItem(COOKIE_NOTICE_KEY, 'acknowledged'); } catch {}\n    privacyBanner.hidden = true;\n    privacyBanner.setAttribute('hidden', '');\n    privacyBanner.style.setProperty('display', 'none', 'important');\n  };\n  if (privacyBanner) {\n    let acknowledged = false;\n    try { acknowledged = localStorage.getItem(COOKIE_NOTICE_KEY) === 'acknowledged'; } catch {}\n    if (acknowledged) hidePrivacyBanner();\n    privacyBanner.addEventListener('click', event => {\n      if (event.target.closest('[data-cookie-accept]')) hidePrivacyBanner();\n    }, true);\n  }\n\n  if (!document.getElementById('spl-back-to-top-style')) {\n    const style = document.createElement('style');\n    style.id = 'spl-back-to-top-style';\n    style.textContent = '.spl-back-to-top{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:7px;min-height:42px;padding:9px 14px;border:1px solid rgba(16,45,41,.18);border-radius:999px;background:rgba(255,255,255,.96);color:#153f37;box-shadow:0 10px 34px rgba(16,45,41,.16);font:750 13px/1.1 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease,visibility .18s ease}.spl-back-to-top.is-visible{opacity:1;visibility:visible;transform:none}.spl-back-to-top:hover{background:#f3faf7}.spl-back-to-top:focus-visible{outline:3px solid #f0bd58;outline-offset:3px}@media(max-width:640px){.spl-back-to-top{right:10px;bottom:10px;padding:9px 12px}.spl-back-to-top span{display:none}}';\n    document.head.append(style);\n  }\n  let backToTop = document.querySelector('[data-spl-back-to-top]');\n  if (!backToTop) {\n    backToTop = document.createElement('button');\n    backToTop.type = 'button';\n    backToTop.className = 'spl-back-to-top';\n    backToTop.dataset.splBackToTop = '1';\n    backToTop.setAttribute('aria-label', 'Torna all’inizio della pagina');\n    backToTop.innerHTML = '<b aria-hidden=\"true\">↑</b><span>Torna su</span>';\n    document.body.append(backToTop);\n    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));\n  }\n  const updateBackToTop = () => {\n    const bannerVisible = privacyBanner && !privacyBanner.hidden && getComputedStyle(privacyBanner).display !== 'none';\n    backToTop.classList.toggle('is-visible', window.scrollY > 520 && !bannerVisible);\n  };\n  window.addEventListener('scroll', updateBackToTop, { passive: true });\n  if (privacyBanner) privacyBanner.addEventListener('click', () => setTimeout(updateBackToTop, 0), true);\n  updateBackToTop();\n\n  if (!document.body || !document.body.classList.contains('studio-editor-page')) return;\n  if (document.documentElement.dataset.splNotesPatch === '1') return;"""
s = replace_once(s, old_start, new_start, 'global privacy and back-to-top')

old_action = """    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*=\"/genera\"]');\n    const chapterMuseAction = chapterMuseButton ? chapterMuseButton.formAction : form.action.replace(/\\/salva$/, '/genera');\n    labels.forEach((entry, index) => {"""
new_action = """    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*=\"/genera\"]');\n    const chapterMuseAction = chapterMuseButton ? chapterMuseButton.formAction : form.action.replace(/\\/salva$/, '/genera');\n    if (chapterMuseButton) chapterMuseButton.remove();\n    labels.forEach((entry, index) => {"""
s = replace_once(s, old_action, new_action, 'remove duplicate chapter Musa')
studio_path.write_text(s, encoding='utf-8')

worker_path = Path('src/worker.js')
w = worker_path.read_text(encoding='utf-8')
old_version = next((v for v in ['20260831-2','20260831-1','20260829-1'] if f'/assets/studio.js?v={v}' in w), None)
if not old_version:
    raise SystemExit('studio asset version not found')
w = w.replace(f'/assets/studio.js?v={old_version}', '/assets/studio.js?v=20260901-1')
worker_path.write_text(w, encoding='utf-8')

checks = {
  'cookie hard close': "style.setProperty('display', 'none', 'important')" in s,
  'cookie persistence': 'splendoria-cookie-notice-v2' in s,
  'duplicate Musa removed': 'if (chapterMuseButton) chapterMuseButton.remove();' in s,
  'section Musa retained': "sectionMuse.textContent = 'Affidati alla Musa per questa sezione'" in s,
  'back to top': 'data-spl-back-to-top' in s and 'Torna su' in s,
  'cache bust': '/assets/studio.js?v=20260901-1' in w,
}
print(checks)
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Guardrails failed: ' + ', '.join(failed))
