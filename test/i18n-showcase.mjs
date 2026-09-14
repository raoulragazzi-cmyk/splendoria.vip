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

const get = async path => {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  return { response, html: await response.text() };
};

function stripLanguageAdditions(html) {
  return html
    .replace(/<style id="spl-language-style">[\s\S]*?<\/style>/, '')
    .replace(/<div class="spl-language-bar">[\s\S]*?<\/div><\/div>/, '')
    .replace(/<link rel="alternate" hreflang="(?:it|de|en|x-default)" href="[^"]+">/g, '');
}

const baseIt = await (await baseWorker.fetch(new Request('https://www.splendoria.vip/'), env)).text();
const { response: itResponse, html: it } = await get('/');
if (itResponse.status !== 200) throw new Error(`IT root status ${itResponse.status}`);
if (stripLanguageAdditions(it) !== baseIt) throw new Error('Italian homepage changed beyond language selector/hreflang additions');
if (!it.includes('<html lang="it">') || !it.includes('href="/de/"') || !it.includes('href="/en/"') || !it.includes('aria-current="page">IT</a>')) throw new Error('Italian language selector incomplete');
if (!it.includes('Il diritto di essere ricordati.') || !it.includes('Posso inserire fotografie?')) throw new Error('Italian baseline copy missing');
console.log('IT: baseline preserved; language selector only');

const expected = {
  de: {
    title: 'Ihr Leben als Roman — Splendoria',
    hero: 'Ihre Geschichte – bestimmt, Jahrhunderte zu überdauern.',
    remembered: 'Das Recht, in Erinnerung zu bleiben.',
    photos: 'Kann ich Fotografien einfügen?',
    menu: 'So funktioniert es',
    locale: 'de_DE'
  },
  en: {
    title: 'Your life as a novel — Splendoria',
    hero: 'Your story, made to live for centuries.',
    remembered: 'The right to be remembered.',
    photos: 'Can I include photographs?',
    menu: 'How it works',
    locale: 'en_GB'
  }
};

for (const [locale, copy] of Object.entries(expected)) {
  const { response, html } = await get(`/${locale}/`);
  if (response.status !== 200) throw new Error(`${locale}: status ${response.status}`);
  const canonical = `https://www.splendoria.vip/${locale}/`;
  const required = [
    `<html lang="${locale}">`,
    `<title>${copy.title}</title>`,
    `<link rel="canonical" href="${canonical}">`,
    `property="og:locale" content="${copy.locale}"`,
    `property="og:url" content="${canonical}"`,
    'hreflang="it" href="https://www.splendoria.vip/"',
    'hreflang="de" href="https://www.splendoria.vip/de/"',
    'hreflang="en" href="https://www.splendoria.vip/en/"',
    'hreflang="x-default" href="https://www.splendoria.vip/"',
    `aria-current="page">${locale.toUpperCase()}</a>`,
    copy.hero,
    copy.remembered,
    copy.photos,
    copy.menu,
    `action="/${locale}/contatti"`,
    `/assets/i18n-showcase.js?lang=${locale}`
  ];
  for (const marker of required) if (!html.includes(marker)) throw new Error(`${locale}: missing ${marker}`);

  const forbidden = [
    '>Come funziona<',
    '>Il diritto di essere ricordati.<',
    '>Posso inserire fotografie?<',
    '>Genera la Scheda Tecnica<',
    '>Affida la scheda a Splendoria<',
    '>Entra nello Studio di Scrittura<',
    '>Ho capito<'
  ];
  for (const marker of forbidden) if (html.includes(marker)) throw new Error(`${locale}: untranslated visible marker ${marker}`);
  console.log(`${locale.toUpperCase()}: localized showcase, SEO and selector valid`);
}

for (const locale of ['de', 'en']) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}`), env);
  if (response.status !== 308 || response.headers.get('location') !== `https://www.splendoria.vip/${locale}/`) throw new Error(`${locale}: canonical slash redirect invalid`);
}

const deGuide = await worker.fetch(new Request('https://www.splendoria.vip/de/guida'), env);
if (deGuide.status !== 404) throw new Error('Phase boundary violated: /de/guida should not exist before public-page translation');
const localizedAdmin = await worker.fetch(new Request('https://www.splendoria.vip/de/admin'), env);
if (localizedAdmin.status !== 404) throw new Error('Admin must never receive localized routes');
const admin = await worker.fetch(new Request('https://www.splendoria.vip/admin'), env);
const adminBody = await admin.text();
if (adminBody.includes('spl-language-bar')) throw new Error('Admin must not contain language selector');
console.log('Boundaries: supporting pages staged; admin excluded');
