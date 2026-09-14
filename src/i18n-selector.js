const ROOT_PATHS = { it: '/', de: '/de/', en: '/en/' };
const LABELS = { it: 'IT', de: 'DE', en: 'EN' };
const STYLE = `<style id="spl-language-style">.spl-language-bar{background:#08291f;color:#fff;border-bottom:1px solid rgba(197,160,89,.32)}.spl-language-bar>.wrap{display:flex;justify-content:flex-end}.spl-language-switch{display:flex;align-items:center;gap:0;min-height:34px}.spl-language-switch a{display:inline-flex;align-items:center;justify-content:center;min-width:42px;min-height:34px;padding:4px 10px;color:#dbe6e1;text-decoration:none;font:750 12px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.09em;border-left:1px solid rgba(255,255,255,.13)}.spl-language-switch a:last-child{border-right:1px solid rgba(255,255,255,.13)}.spl-language-switch a[aria-current="page"]{color:#f1d397;background:rgba(255,255,255,.06)}.spl-language-switch a:hover{color:#fff;background:rgba(255,255,255,.08)}@media(max-width:640px){.spl-language-bar>.wrap{justify-content:center}.spl-language-switch a{min-width:48px}}</style>`;

export function ensureShowcaseSelector(html, locale, pagePaths = ROOT_PATHS) {
  if (!html.includes('id="spl-language-style"')) html = html.replace('</head>', `${STYLE}</head>`);
  if (html.includes('class="spl-language-bar"')) return html;
  const aria = locale === 'de' ? 'Sprache wählen' : locale === 'en' ? 'Choose language' : 'Scegli lingua';
  const paths = { ...ROOT_PATHS, ...(pagePaths || {}) };
  const links = ['it', 'de', 'en'].map(code => `<a href="${paths[code]}" hreflang="${code}" lang="${code}"${code === locale ? ' aria-current="page"' : ''}>${LABELS[code]}</a>`).join('');
  const bar = `<div class="spl-language-bar"><div class="wrap"><nav class="spl-language-switch" aria-label="${aria}">${links}</nav></div></div>`;
  const anchor = '<nav class="nav"';
  if (!html.includes(anchor)) throw new Error('Splendoria main navigation anchor not found');
  return html.replace(anchor, `${bar}${anchor}`);
}
