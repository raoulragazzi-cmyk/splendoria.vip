import baseWorker from '../src/worker.js';
import worker from '../src/studio-worker.js';

const DB = {
  prepare(sql = '') {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async first() { return sql === 'SELECT 1 AS ok' ? { ok: 1 } : null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const env = {
  DB,
  APP_URL: 'https://www.splendoria.vip',
  ADMIN_EMAIL: 'raoulragazzi@gmail.com',
  EMAIL_FROM: 'contatti@splendoria.vip',
  AI: { async run() { return { response: 'Le radici\nLa svolta\nIl futuro\nEpilogo' }; } }
};

const request = async path => {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  return { response, html: await response.text() };
};

const stripLanguageAdditions = html => html
  .replace(/<style id="spl-language-style">[\s\S]*?<\/style>/, '')
  .replace(/<div class="spl-language-bar">[\s\S]*?<\/div><\/div>/, '')
  .replace(/<link rel="alternate" hreflang="(?:it|de|en|x-default)" href="[^"]+">/g, '');

const baseGuide = await (await baseWorker.fetch(new Request('https://www.splendoria.vip/guida'), env)).text();
const italianGuide = await request('/guida');
if (italianGuide.response.status !== 200) throw new Error(`IT guide status ${italianGuide.response.status}`);
if (stripLanguageAdditions(italianGuide.html) !== baseGuide) throw new Error('Italian guide changed beyond selector/hreflang additions');
for (const marker of [
  'aria-current="page">IT</a>',
  'href="/de/leitfaden"',
  'href="/en/guide"',
  'hreflang="de" href="https://www.splendoria.vip/de/leitfaden"',
  'hreflang="en" href="https://www.splendoria.vip/en/guide"'
]) if (!italianGuide.html.includes(marker)) throw new Error(`IT guide missing ${marker}`);
console.log('IT guide: baseline preserved; selector and reciprocal hreflang only');

const guides = {
  de: { path: '/de/leitfaden', title: 'Leitfaden zum Studio — Splendoria', h1: 'Ihr Buch, Schritt für Schritt', menu: 'So funktioniert es', current: 'DE', locale: 'de_DE' },
  en: { path: '/en/guide', title: 'Studio Guide — Splendoria', h1: 'Your book, one step at a time', menu: 'How it works', current: 'EN', locale: 'en_GB' }
};
for (const [locale, expected] of Object.entries(guides)) {
  const { response, html } = await request(expected.path);
  if (response.status !== 200) throw new Error(`${locale} guide status ${response.status}`);
  const canonical = `https://www.splendoria.vip${expected.path}`;
  for (const marker of [
    `<html lang="${locale}">`, `<title>${expected.title}</title>`, `<link rel="canonical" href="${canonical}">`,
    `property="og:locale" content="${expected.locale}"`, `aria-current="page">${expected.current}</a>`, expected.h1, expected.menu,
    'href="/guida"', 'href="/de/leitfaden"', 'href="/en/guide"'
  ]) if (!html.includes(marker)) throw new Error(`${locale} guide missing ${marker}`);
  for (const forbidden of ['>Come funziona<', '>Guida<', '>Il tuo libro, un passo alla volta<', '>Ho capito<']) {
    if (html.includes(forbidden)) throw new Error(`${locale} guide untranslated visible marker ${forbidden}`);
  }
}

const legalPages = [
  {
    key: 'privacy', it: '/privacy-policy', de: '/de/datenschutz', en: '/en/privacy-policy',
    deTitle: 'Datenschutz — Splendoria', enTitle: 'Privacy Policy — Splendoria', deH1: '<h1>Datenschutz</h1>', enH1: '<h1>Privacy Policy</h1>',
    itMarker: 'Ultimo aggiornamento: 29 agosto 2026', stableMarker: 'local storage del dispositivo fino a 365 giorni dall’ultima modifica'
  },
  {
    key: 'cookies', it: '/cookie-policy', de: '/de/cookie-richtlinie', en: '/en/cookie-policy',
    deTitle: 'Cookie-Richtlinie — Splendoria', enTitle: 'Cookie Policy — Splendoria', deH1: '<h1>Cookie-Richtlinie</h1>', enH1: '<h1>Cookie Policy</h1>',
    itMarker: 'splendoria:client-draft:v1:', stableMarker: 'Fino a 365 giorni dall’ultima modifica'
  },
  {
    key: 'terms', it: '/termini-condizioni', de: '/de/agb', en: '/en/terms-and-conditions',
    deTitle: 'Allgemeine Geschäftsbedingungen — Splendoria', enTitle: 'Terms and Conditions — Splendoria', deH1: '<h1>Allgemeine Geschäftsbedingungen</h1>', enH1: '<h1>Terms and Conditions</h1>',
    itMarker: '<h1>Termini e condizioni</h1>'
  },
  {
    key: 'notice', it: '/note-legali', de: '/de/impressum', en: '/en/legal-notice',
    deTitle: 'Impressum und rechtliche Hinweise — Splendoria', enTitle: 'Legal Notice — Splendoria', deH1: '<h1>Impressum und rechtliche Hinweise</h1>', enH1: '<h1>Legal Notice</h1>',
    itMarker: '<h1>Note legali</h1>'
  },
  {
    key: 'ai', it: '/trasparenza-ai', de: '/de/ki-transparenz', en: '/en/ai-transparency',
    deTitle: 'Transparenz zur künstlichen Intelligenz — Splendoria', enTitle: 'Artificial Intelligence Transparency — Splendoria', deH1: '<h1>Transparenz zur künstlichen Intelligenz</h1>', enH1: '<h1>Artificial Intelligence Transparency</h1>',
    itMarker: '<h1>Trasparenza sull’intelligenza artificiale</h1>'
  }
];

for (const page of legalPages) {
  const italian = await request(page.it);
  if (italian.response.status !== 200) throw new Error(`IT ${page.key} status ${italian.response.status}`);
  if (!italian.html.includes(page.itMarker)) throw new Error(`IT ${page.key} authoritative copy missing`);
  if (page.stableMarker && !italian.html.includes(page.stableMarker)) throw new Error(`IT ${page.key} current privacy-center copy was altered`);
  for (const marker of [
    'aria-current="page">IT</a>', `href="${page.de}"`, `href="${page.en}"`,
    `hreflang="de" href="https://www.splendoria.vip${page.de}"`, `hreflang="en" href="https://www.splendoria.vip${page.en}"`
  ]) if (!italian.html.includes(marker)) throw new Error(`IT ${page.key} missing ${marker}`);

  if (!['privacy', 'cookies'].includes(page.key)) {
    const base = await (await baseWorker.fetch(new Request(`https://www.splendoria.vip${page.it}`), env)).text();
    if (stripLanguageAdditions(italian.html) !== base) throw new Error(`Italian ${page.key} changed beyond selector/hreflang additions`);
  }

  for (const locale of ['de', 'en']) {
    const path = page[locale];
    const { response, html } = await request(path);
    if (response.status !== 200) throw new Error(`${locale} ${page.key} status ${response.status}`);
    const title = locale === 'de' ? page.deTitle : page.enTitle;
    const h1 = locale === 'de' ? page.deH1 : page.enH1;
    const localeCode = locale === 'de' ? 'de_DE' : 'en_GB';
    for (const marker of [
      `<html lang="${locale}">`, `<title>${title}</title>`, `<link rel="canonical" href="https://www.splendoria.vip${path}">`,
      `property="og:locale" content="${localeCode}"`, h1, `aria-current="page">${locale.toUpperCase()}</a>`,
      `href="${page.it}"`, `href="${page.de}"`, `href="${page.en}"`
    ]) if (!html.includes(marker)) throw new Error(`${locale} ${page.key} missing ${marker}`);
    for (const forbidden of ['>Come funziona<', '>Contattaci<', '>Ho capito<']) {
      if (html.includes(forbidden)) throw new Error(`${locale} ${page.key} untranslated chrome marker ${forbidden}`);
    }
  }
}
console.log('Legal public pages: Italian authoritative copy preserved; DE/EN routes and SEO valid');

const sitemap = await request('/sitemap.xml');
if (sitemap.response.status !== 200) throw new Error(`sitemap status ${sitemap.response.status}`);
for (const path of ['/', '/de/', '/en/', '/guida', '/de/leitfaden', '/en/guide', ...legalPages.flatMap(page => [page.it, page.de, page.en])]) {
  const loc = `https://www.splendoria.vip${path}`;
  if (!sitemap.html.includes(`<loc>${loc}</loc>`)) throw new Error(`sitemap missing ${loc}`);
}
console.log('Sitemap: Italian URLs retained and all translated public routes included');

const legacyDeGuide = await request('/de/guida');
if (legacyDeGuide.response.status !== 404) throw new Error('/de/guida must remain 404; canonical DE guide is /de/leitfaden');
for (const bad of ['/de/privacy-policy', '/de/termini-condizioni', '/en/termini-condizioni', '/de/admin', '/en/admin']) {
  const probe = await request(bad);
  if (probe.response.status !== 404) throw new Error(`${bad} must not resolve`);
}
const unknown = await request('/de/pagina-che-non-esiste');
if (unknown.response.status !== 404 || !unknown.html.includes('noindex')) throw new Error('Unknown localized path must remain a noindex 404');
const admin = await request('/admin');
if (admin.html.includes('spl-language-bar')) throw new Error('Admin must not contain language selector');
console.log('Boundaries: aliases fail closed, unknown localized paths are noindex, admin remains excluded');
