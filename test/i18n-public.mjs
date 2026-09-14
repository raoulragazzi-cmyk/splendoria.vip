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

const locales = {
  de: {
    path: '/de/leitfaden',
    title: 'Leitfaden zum Studio — Splendoria',
    h1: 'Ihr Buch, Schritt für Schritt',
    menu: 'So funktioniert es',
    current: 'DE',
    locale: 'de_DE'
  },
  en: {
    path: '/en/guide',
    title: 'Studio Guide — Splendoria',
    h1: 'Your book, one step at a time',
    menu: 'How it works',
    current: 'EN',
    locale: 'en_GB'
  }
};

for (const [locale, expected] of Object.entries(locales)) {
  const { response, html } = await request(expected.path);
  if (response.status !== 200) throw new Error(`${locale} guide status ${response.status}`);
  const canonical = `https://www.splendoria.vip${expected.path}`;
  for (const marker of [
    `<html lang="${locale}">`,
    `<title>${expected.title}</title>`,
    `<link rel="canonical" href="${canonical}">`,
    `property="og:locale" content="${expected.locale}"`,
    `aria-current="page">${expected.current}</a>`,
    expected.h1,
    expected.menu,
    'href="/guida"',
    'href="/de/leitfaden"',
    'href="/en/guide"'
  ]) if (!html.includes(marker)) throw new Error(`${locale} guide missing ${marker}`);
  for (const forbidden of ['>Come funziona<', '>Guida<', '>Il tuo libro, un passo alla volta<', '>Ho capito<']) {
    if (html.includes(forbidden)) throw new Error(`${locale} guide untranslated visible marker ${forbidden}`);
  }
}

const legacyDeGuide = await request('/de/guida');
if (legacyDeGuide.response.status !== 404) throw new Error('/de/guida must remain 404; canonical DE guide is /de/leitfaden');
const localizedAdmin = await request('/de/admin');
if (localizedAdmin.response.status !== 404) throw new Error('Admin must never receive localized routes');
const admin = await request('/admin');
if (admin.html.includes('spl-language-bar')) throw new Error('Admin must not contain language selector');
console.log('Public guide i18n: DE/EN valid; admin remains excluded');
