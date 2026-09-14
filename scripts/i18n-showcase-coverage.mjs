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

const invariantTerms = new Set([
  'Splendoria', 'Digital', 'Premium', 'Signature', 'Email', 'Scuola Holden', 'Governance',
  'Privacy', 'Privacy Policy', 'Cookie Policy', '/ 100'
]);
function isInvariant(value) {
  if (invariantTerms.has(value)) return true;
  if (/^(?:0?[1-9]|I|II|III)$/.test(value)) return true;
  if (/^\d[\d.]*\s*€$/.test(value)) return true;
  if (/^Splendoria (?:Digital|Premium|Signature) · \d[\d.]* €$/.test(value)) return true;
  if (/^AI Arena di Raoul Ragazzi · (?:P\.IVA|Partita IVA) 02950290219$/.test(value)) return true;
  if (/^Via Goethe 42, .*(?:Milano|Milano \(MI\))/.test(value)) return true;
  return false;
}

for (const locale of ['de', 'en']) {
  const html = await (await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/`), env)).text();
  const localized = new Set(texts(html));
  const unchanged = base.filter(value => localized.has(value));
  const suspicious = unchanged.filter(value => !isInvariant(value));
  console.log(`${locale.toUpperCase()} residual identical strings: ${JSON.stringify(unchanged)}`);
  if (suspicious.length) {
    console.error(`${locale.toUpperCase()} suspicious untranslated strings: ${JSON.stringify(suspicious)}`);
    process.exitCode = 1;
  } else {
    console.log(`${locale.toUpperCase()} visible-text coverage: no unexpected Italian copy remains.`);
  }
}
