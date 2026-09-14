import worker from '../src/worker.js';
import { writeFileSync, mkdirSync } from 'node:fs';

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

const targets = [
  { path: '/', phase: 'vetrina', label: 'Homepage vetrina' },
  { path: '/guida', phase: 'pubblico', label: 'Guida allo Studio' },
  { path: '/privacy-policy', phase: 'pubblico-legale', label: 'Privacy Policy' },
  { path: '/cookie-policy', phase: 'pubblico-legale', label: 'Cookie Policy' },
  { path: '/termini-condizioni', phase: 'pubblico-legale', label: 'Termini e condizioni' },
  { path: '/note-legali', phase: 'pubblico-legale', label: 'Note legali' },
  { path: '/trasparenza-ai', phase: 'pubblico-legale', label: 'Trasparenza IA' },
  { path: '/accedi', phase: 'operativo-accesso', label: 'Scelta area' },
  { path: '/area-clienti', phase: 'operativo-accesso', label: 'Login cliente' },
  { path: '/registrati', phase: 'operativo-accesso', label: 'Registrazione' },
  { path: '/password-dimenticata', phase: 'operativo-accesso', label: 'Recupero password' }
];

function decode(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function visibleText(html) {
  const cleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, '\n');
  const seen = new Set();
  const out = [];
  for (const line of decode(cleaned).split(/\n+/)) {
    const value = line.replace(/\s+/g, ' ').trim();
    if (!value || value.length < 2 || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function attrValues(html, attr) {
  return [...html.matchAll(new RegExp(`${attr}=["']([^"']+)["']`, 'gi'))].map(m => decode(m[1]).replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function translatableAttributes(html) {
  const attrs = ['alt', 'aria-label', 'placeholder', 'title'];
  return Object.fromEntries(attrs.map(attr => [attr, [...new Set(attrValues(html, attr))].filter(value => !/^https?:|^\/|^#/.test(value))]));
}

const rows = [];
for (const target of targets) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${target.path}`), env);
  const html = await response.text();
  rows.push({
    ...target,
    status: response.status,
    lang: html.match(/<html\s+lang=["']([^"']+)/i)?.[1] || '',
    title: decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''),
    canonical: html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1] || '',
    robots: html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)/i)?.[1] || '',
    hrefs: [...new Set(attrValues(html, 'href'))].sort(),
    actions: [...new Set(attrValues(html, 'action'))].sort(),
    attrs: translatableAttributes(html),
    texts: visibleText(html)
  });
}

const adminProbe = await worker.fetch(new Request('https://www.splendoria.vip/admin'), env);
const adminHtml = await adminProbe.text();

const md = [
  '# Splendoria — audit multilingua',
  '',
  `Generato: ${new Date().toISOString()}`,
  '',
  '## Principi di implementazione',
  '',
  '- Italiano attuale come baseline immutata nei contenuti.',
  '- URL distinti per lingua: `/` (IT), `/de/...`, `/en/...`.',
  '- Nessun redirect automatico basato su IP o browser: selezione esplicita IT / DE / EN.',
  '- `lang`, canonical, `hreflang` reciproci e `x-default` sulle sole pagine effettivamente tradotte.',
  '- Area amministratore esclusa da traduzione e da qualsiasi selettore lingua.',
  '- Traduzioni separate dalla logica applicativa, con fallback sicuro all’italiano solo in sviluppo/test, mai come pagina indicizzabile mista.',
  '',
  '## Inventario',
  '',
  '| Percorso | Fase | Stato | lang | Indicizzabile | Testi unici | Link | Form |',
  '|---|---|---:|---|---|---:|---:|---:|',
  ...rows.map(r => `| \`${r.path}\` | ${r.phase} | ${r.status} | ${r.lang || '—'} | ${r.robots.includes('noindex') ? 'no' : 'sì'} | ${r.texts.length} | ${r.hrefs.length} | ${r.actions.length} |`),
  '',
  '## Esclusione admin',
  '',
  `- /admin: stato ${adminProbe.status}; contenuto rilevato ${adminHtml.includes('Splendoria') ? 'sì' : 'no'}. La pagina è intenzionalmente esclusa dalla matrice i18n.`,
  '',
  ...rows.flatMap(r => [
    `## ${r.label} — \`${r.path}\``,
    '',
    `- Titolo: ${r.title || '—'}`,
    `- Canonical: ${r.canonical || '—'}`,
    `- Robots: ${r.robots || '—'}`,
    `- Link: ${r.hrefs.map(v => `\`${v}\``).join(', ') || '—'}`,
    `- Form action: ${r.actions.map(v => `\`${v}\``).join(', ') || '—'}`,
    '',
    '### Attributi traducibili',
    '',
    ...Object.entries(r.attrs).flatMap(([attr, values]) => [`- **${attr}**`, ...(values.length ? values.map(value => `  - ${value}`) : ['  - —'])]),
    '',
    '### Testi visibili',
    '',
    ...r.texts.map((text, i) => `${i + 1}. ${text}`),
    ''
  ])
].join('\n');

mkdirSync('docs', { recursive: true });
writeFileSync('docs/i18n-audit-2026-09-14.md', md, 'utf8');
console.log(`Audit scritto: ${rows.length} pagine pubbliche/operative, admin escluso.`);
