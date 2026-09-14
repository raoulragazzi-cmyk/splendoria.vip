const PATHS = { it: '/', de: '/de/', en: '/en/' };
const LABELS = { it: 'IT', de: 'DE', en: 'EN' };

export function ensureShowcaseSelector(html, locale) {
  if (html.includes('class="spl-language-bar"')) return html;
  const aria = locale === 'de' ? 'Sprache wählen' : locale === 'en' ? 'Choose language' : 'Scegli lingua';
  const links = ['it', 'de', 'en'].map(code => `<a href="${PATHS[code]}" hreflang="${code}" lang="${code}"${code === locale ? ' aria-current="page"' : ''}>${LABELS[code]}</a>`).join('');
  const bar = `<div class="spl-language-bar"><div class="wrap"><nav class="spl-language-switch" aria-label="${aria}">${links}</nav></div></div>`;
  const anchor = '<nav class="nav"';
  if (!html.includes(anchor)) throw new Error('Splendoria main navigation anchor not found');
  return html.replace(anchor, `${bar}${anchor}`);
}
