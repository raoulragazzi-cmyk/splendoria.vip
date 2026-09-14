import baseWorker from '../src/worker.js';
import worker from '../src/studio-worker.js';

const DB = {
  prepare(sql = '') { return { bind() { return this; }, async run() { return { success: true }; }, async first() { return sql === 'SELECT 1 AS ok' ? { ok: 1 } : null; }, async all() { return { results: [] }; } }; },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const env = { DB, APP_URL: 'https://www.splendoria.vip', ADMIN_EMAIL: 'raoulragazzi@gmail.com', EMAIL_FROM: 'contatti@splendoria.vip', AI: { async run() { return { response: '' }; } } };

const decode = value => String(value)
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

function texts(html) {
  const cleaned = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, '\n');
  return [...new Set(decode(cleaned).split(/\n+/).map(v => v.replace(/\s+/g, ' ').trim()).filter(v => v.length > 1))];
}

const baseHtml = await (await baseWorker.fetch(new Request('https://www.splendoria.vip/'), env)).text();
const base = texts(baseHtml);

const globallyAllowed = new Set([
  'Splendoria', 'Digital', 'Premium', 'Signature', 'Email', 'Scuola Holden',
  '1.000 €', '1.900 €', '2.500 €', '01', '02', '03', 'I', 'II', 'III', '/ 100',
  'AI Arena di Raoul Ragazzi · P.IVA 02950290219', 'Via Goethe 42, 39012 Merano (BZ) · Via Settala 1, Milano (MI)'
]);
const byLocale = {
  de: new Set([]),
  en: new Set(['Privacy Policy', 'Cookie Policy', 'Governance'])
};

for (const locale of ['de', 'en']) {
  const html = await (await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/`), env)).text();
  const localized = new Set(texts(html));
  const unchanged = base.filter(value => localized.has(value));
  const suspicious = unchanged.filter(value => !globallyAllowed.has(value) && !byLocale[locale].has(value) && !/^\d+(?:[%.,\s€]|$)/.test(value));
  console.log(`${locale.toUpperCase()} unchanged visible strings:`);
  console.log(unchanged.map(v => `  - ${v}`).join('\n'));
  if (suspicious.length) {
    console.error(`${locale.toUpperCase()} suspicious untranslated strings:`);
    console.error(suspicious.map(v => `  - ${v}`).join('\n'));
    process.exitCode = 1;
  }
}
