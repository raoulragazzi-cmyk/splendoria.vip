import fs from 'node:fs/promises';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !token) throw new Error('Missing Cloudflare credentials for live quality benchmark');

const WRITER = '@cf/qwen/qwen3.8-27b';
const EDITOR = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const endpoint = model => `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

const cases = [
  { id: 'suedtirol-regionality', label: 'Südtirol / regionalità', source: 'Ich bin 1954 in Kaltern geboren. Mein Vater sagte immer „auf die Marende gehen“. Zu Hause sprachen wir Deutsch, mit Kunden oft Italienisch. 1972 begann ich im kleinen Lebensmittelgeschäft meiner Tante in Bozen zu arbeiten. Mehr weiß ich über diesen ersten Tag nicht sicher.', risks: ['non tradurre o neutralizzare Marende', 'non inventare dettagli sul primo giorno', 'preservare naturale alternanza culturale'] },
  { id: 'elderly-voice', label: 'Voce anziana', source: 'Also, ich weiß nicht mehr genau, wann das war. Vielleicht 1968, vielleicht ein Jahr später. Wir hatten nicht viel. Meine Mutter nähte, mein Vater war oft weg wegen der Arbeit. Ich sage immer: Es war kein Unglück, aber leicht war es auch nicht.', risks: ['non rendere la voce troppo letteraria', 'preservare esitazione e misura', 'non trasformare povertà in dramma'] },
  { id: 'company-biography', label: 'Biografia aziendale', source: 'Die Firma wurde 1987 von Anna Berger und ihrem Bruder Paul gegründet. Begonnen hat alles mit drei Mitarbeitern in Meran. 1994 kam der erste größere Auftrag aus Österreich. 2008 zog die Produktion nach Lana. Anna sagt: „Wir wollten nie die Größten sein, sondern verlässlich bleiben.“', risks: ['evitare tono pubblicitario', 'preservare date e nomi', 'non attribuire strategia non documentata'] },
  { id: 'fragmented-memory', label: 'Memoria frammentaria', source: 'Bahnhof. Ein roter Koffer, glaube ich. Meine Schwester war dabei, oder sie kam später nach. Wir fuhren nach München. Ich erinnere mich an die Kälte, aber nicht an den Monat. Es muss nach der Schule gewesen sein. Mehr bekomme ich nicht zusammen.', risks: ['non trasformare ipotesi in fatti', 'preservare frammentarietà', 'non inventare mese, scena o dialoghi'] },
  { id: 'sparse-data', label: 'Pochi dati', source: '1963 Umzug nach Brixen. Neue Schule. Vater arbeitete bei der Bahn. Ich war neun.', risks: ['scrivere poco se i dati non bastano', 'nessuna atmosfera inventata', 'nessun dettaglio familiare aggiunto'] },
  { id: 'contradiction', label: 'Contraddizione nelle fonti', source: 'Notiz A: „Wir eröffneten das Geschäft 1978.“ Notiz B: „Die Eröffnung war im Frühjahr 1979.“ Der Autor sagt heute: „Ich bin mir beim Jahr nicht mehr sicher.“ Sicher ist nur: Das Geschäft war vor 1980 offen.', risks: ['non scegliere arbitrariamente 1978 o 1979', 'esplicitare l’incertezza con misura', 'preservare unico fatto certo: prima del 1980'] },
  { id: 'quotation-integrity', label: 'Citazione', source: 'Meine Großmutter sagte wörtlich: „Tu nicht so wichtig, Bub.“ Diesen Satz möchte ich genau so im Buch behalten. Sonst erinnere ich mich nur daran, dass sie wenig sprach und sehr direkt war.', risks: ['citazione byte-identica', 'non correggere il parlato citato', 'non inventare altre frasi della nonna'] },
  { id: 'already-good', label: 'Testo già buono', source: 'Im Winter lag der Hof früh im Schatten. Mein Vater kam meist schweigend aus dem Stall, stellte die Stiefel neben die Tür und setzte sich an den Küchentisch. Wir mussten nicht viel reden. Dass er da war, genügte.', risks: ['non sovrascrivere una voce già riuscita', 'evitare sinonimi ornamentali', 'intervento editoriale minimo'] }
];

const writerSystem = `PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH\nINTERNE REDAKTION SPLENDORIA — DEUTSCH\nROLLE — GHOSTWRITER\nSchreibe aus dem freigegebenen Material einen kurzen, zusammenhängenden autobiografischen Abschnitt in natürlichem zeitgenössischem Standarddeutsch. Quellen und gelieferte Fakten sind die absolute Grenze des Erfindbaren. Ergänze keine Dialoge, Gedanken, Motive, Sinneseindrücke, Daten, Orte oder Kausalitäten, die nicht belegt sind. Bewahre regionale Begriffe, Unsicherheiten und charakteristische Formulierungen. Wenn das Material dünn ist, schreibe kürzer statt Lücken zu füllen. Keine Überschrift, keine Erklärung.`;
const editorSystem = `INTERNE REDAKTION SPLENDORIA — DEUTSCH\nROLLE — LEKTOR UND STILREDAKTION\nÜberarbeite den folgenden deutschen Text konservativ. Verbessere nur Grammatik, Idiomatik, Rhythmus, Präzision und offensichtliche KI-Muster. Bewahre alle Fakten, Unsicherheiten, Zitate, Regionalismen, Perspektive und Eigenheiten der Stimme. Erfinde nichts. Wenn der Text bereits gut ist, ändere so wenig wie möglich. Keine Erklärung, nur den finalen Text.`;

async function run(model, messages, temperature) {
  const response = await fetch(endpoint(model), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature, max_tokens: 900, enable_thinking: false })
  });
  const raw = await response.text();
  if (!response.ok) return { ok: false, status: response.status, error: raw.slice(0, 1600) };
  let json;
  try { json = JSON.parse(raw); } catch { return { ok: false, status: response.status, error: `Non-JSON: ${raw.slice(0,1600)}` }; }
  const result = json?.result?.response ?? json?.result?.output_text ?? json?.result?.result ?? json?.result;
  return { ok: true, text: typeof result === 'string' ? result.trim() : JSON.stringify(result) };
}

const results = [];
for (const item of cases) {
  const writer = await run(WRITER, [
    { role: 'system', content: writerSystem },
    { role: 'user', content: `QUELLE:\n${item.source}` }
  ], 0.35);
  let editor = { ok: false, status: 0, error: 'Writer unavailable; editor skipped' };
  if (writer.ok) {
    editor = await run(EDITOR, [
      { role: 'system', content: editorSystem },
      { role: 'user', content: `AUTORISIERTE QUELLE:\n${item.source}\n\nZU REDIGIERENDER TEXT:\n${writer.text}` }
    ], 0.2);
  }
  results.push({ ...item, writerModel: WRITER, editorModel: EDITOR, writer, editor });
  if (!writer.ok) break;
}

await fs.mkdir('artifacts', { recursive: true });
await fs.writeFile('artifacts/de-muse-live-quality.json', JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
const markdown = ['# DE Muse live quality benchmark', '', ...results.flatMap(r => [
  `## ${r.label}`, '', '**Fonte**', '', r.source, '', '**Rischi da verificare**', '', ...r.risks.map(x => `- ${x}`), '',
  '**Qwen — Ghostwriter**', '', r.writer.ok ? r.writer.text : `ERRORE HTTP ${r.writer.status}: ${r.writer.error}`, '',
  '**Llama — revisione**', '', r.editor.ok ? r.editor.text : `ERRORE HTTP ${r.editor.status}: ${r.editor.error}`, ''
])].join('\n');
await fs.writeFile('artifacts/de-muse-live-quality.md', markdown);
console.log(`Live benchmark captured: ${results.length} case(s), writer_ok=${results.every(r => r.writer.ok)}`);
