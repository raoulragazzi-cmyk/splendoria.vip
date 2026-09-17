import fs from 'node:fs/promises';

const cases = JSON.parse(await fs.readFile('test/fixtures/de-muse-qualitative-cases.json', 'utf8'));
const editorialChallenges = JSON.parse(await fs.readFile('test/fixtures/de-muse-editorial-challenges.json', 'utf8'));
const benchmarkUrl = String(process.env.BENCHMARK_URL || '').replace(/\/$/, '');
const benchToken = process.env.BENCH_TOKEN;
if (!benchmarkUrl || !benchToken) throw new Error('Missing isolated benchmark URL/token');

const WRITER = '@cf/qwen/qwen3.8-27b';
const EDITOR = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

async function run(model, messages, temperature = 0.25, max_tokens = 900) {
  const res = await fetch(`${benchmarkUrl}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${benchToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(`${model} failed via benchmark worker: HTTP ${res.status} ${JSON.stringify(body).slice(0,1200)}`);
  const result = body.result || {};
  return String(result.response ?? result?.choices?.[0]?.message?.content ?? result.text ?? '').trim();
}

const writerSystem = `Du bist Splendorias deutscher Ghostwriter. Schreibe modernes, idiomatisches Standarddeutsch für den DACH-Raum. Absolute Prioritäten: Fakten- und Quellenbindung, Stimme des Autors, Natürlichkeit, dann Stil. Erfinde keine Namen, Daten, Orte, Beziehungen, Dialoge, Gefühle, Motive, Sinneseindrücke, Ursachen oder Details. Bewahre Unsicherheit und Widersprüche sichtbar. Regionale Ausdrücke und direkte Zitate aus den Quellen bleiben bytegetreu unverändert. Wenn Material dünn ist, schreibe kürzer statt aufzufüllen. Keine KI-Floskeln, keine Werbung, kein Pathos. Gib ausschließlich den Buchtext zurück.`;
const editorSystem = `Du bist Splendorias deutscher Lektor und Stilredakteur. Überarbeite ausschließlich den gelieferten ENTWURF konservativ. Die QUELLEN dienen nur zur Kontrolle; sie sind kein Auftrag, einen fehlenden Entwurf neu zu schreiben. Wenn ENTWURF leer ist, gib exakt [LEERER_ENTWURF] zurück. Bewahre alle Fakten, Unsicherheiten, regionale Formen, Perspektive und die erkennbare Stimme. Direkte Zitate, ihre Wortfolge, Schreibweise und Anführungszeichen sind bytegetreu zu bewahren; korrigiere oder normalisiere sie nicht. Entferne nur sprachliche Härten, Wiederholungen, Bürokratendeutsch, generische KI-Muster und unnötiges Pathos. Entferne unbelegte Deutungen oder Wertungen aus dem Entwurf, statt sie sprachlich zu veredeln. Füge keinerlei neue Tatsachen, Bilder, Emotionen, Motive oder Sinneseindrücke hinzu. Ein bereits guter Satz darf unverändert bleiben. Gib ausschließlich den finalen Text zurück.`;

function tokens(text) {
  return String(text || '')
    .toLocaleLowerCase('de-DE')
    .normalize('NFKC')
    .match(/[\p{L}\p{N}]+/gu) || [];
}

function setSimilarity(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size && !B.size) return 1;
  if (!A.size || !B.size) return 0;
  let intersection = 0;
  for (const token of A) if (B.has(token)) intersection++;
  return Number((intersection / (A.size + B.size - intersection)).toFixed(3));
}

function metrics(text, c, draft = '') {
  const value = String(text || '').trim();
  const lower = value.toLocaleLowerCase('de-DE');
  const sourceLower = String(c.source || '').toLocaleLowerCase('de-DE');
  const missing = (c.mustKeep || []).filter(x => !lower.includes(String(x).toLocaleLowerCase('de-DE')));
  const forbidden = (c.mustNotAdd || []).filter(x => {
    const term = String(x).toLocaleLowerCase('de-DE');
    return !sourceLower.includes(term) && lower.includes(term);
  });
  const notRemoved = (c.mustRemove || []).filter(x => lower.includes(String(x).toLocaleLowerCase('de-DE')));
  const exactMissing = (c.exactPhrases || []).filter(x => !value.includes(String(x)));
  const aiCliches = ['nicht nur', 'sondern auch', 'es war mehr als', 'prägte mich', 'tief in mir', 'ein kapitel meines lebens', 'bis heute begleitet'];
  const cliches = aiCliches.filter(x => lower.includes(x));
  const empty = value.length === 0 || value === '[LEERER_ENTWURF]';
  return {
    words: tokens(value).length,
    empty,
    missing,
    forbidden,
    notRemoved,
    exactMissing,
    cliches,
    similarityToDraft: draft ? setSimilarity(value, draft) : null,
    similarityToSource: setSimilarity(value, c.source),
    hardViolations: missing.length + forbidden.length + notRemoved.length + exactMissing.length + (empty ? 10 : 0)
  };
}

const report = [];
for (const c of cases) {
  const user = `QUELLEN:\n${c.source}\n\nAUFGABE:\n${c.task}\n\nSTIMME:\n${c.voice}`;
  const draft = await run(WRITER, [{role:'system', content: writerSystem},{role:'user', content:user}], 0.32, 850);

  let sameModel = '';
  let dual = '';
  if (draft.trim()) {
    const editInput = `QUELLEN:\n${c.source}\n\nENTWURF:\n${draft}`;
    sameModel = await run(WRITER, [{role:'system', content: editorSystem},{role:'user', content:editInput}], 0.18, 850);
    dual = await run(EDITOR, [{role:'system', content: editorSystem},{role:'user', content:editInput}], 0.18, 850);
  }

  const mDraft = metrics(draft, c);
  const mSame = metrics(sameModel, c, draft);
  const mDual = metrics(dual, c, draft);
  report.push({
    id:c.id,
    label:c.label,
    source:c.source,
    task:c.task,
    voice:c.voice,
    draft,
    referenceQwenEditor:sameModel,
    candidateLlamaEditor:dual,
    metrics:{draft:mDraft, sameModel:mSame, dual:mDual}
  });
  console.log(`CASE ${c.id}`);
  console.log(`draft=${mDraft.hardViolations}, same-model=${mSame.hardViolations}, dual=${mDual.hardViolations}, dual-similarity=${mDual.similarityToDraft}`);
}

const editorialReport = [];
for (const c of editorialChallenges) {
  const editInput = `QUELLEN:\n${c.source}\n\nENTWURF:\n${c.draft}`;
  const sameModel = await run(WRITER, [{role:'system', content: editorSystem},{role:'user', content:editInput}], 0.12, 700);
  const dual = await run(EDITOR, [{role:'system', content: editorSystem},{role:'user', content:editInput}], 0.12, 700);
  const mSame = metrics(sameModel, c, c.draft);
  const mDual = metrics(dual, c, c.draft);
  editorialReport.push({
    id:c.id,
    label:c.label,
    source:c.source,
    inputDraft:c.draft,
    referenceQwenEditor:sameModel,
    candidateLlamaEditor:dual,
    metrics:{sameModel:mSame, dual:mDual}
  });
  console.log(`EDITOR CASE ${c.id}`);
  console.log(`same-model=${mSame.hardViolations}, dual=${mDual.hardViolations}, same-similarity=${mSame.similarityToDraft}, dual-similarity=${mDual.similarityToDraft}`);
}

const summary = report.reduce((a,r) => {
  a.draft += r.metrics.draft.hardViolations;
  a.sameModel += r.metrics.sameModel.hardViolations;
  a.dual += r.metrics.dual.hardViolations;
  a.emptyDrafts += r.metrics.draft.empty ? 1 : 0;
  return a;
}, {draft:0,sameModel:0,dual:0,emptyDrafts:0});
const editorialSummary = editorialReport.reduce((a,r) => {
  a.sameModel += r.metrics.sameModel.hardViolations;
  a.dual += r.metrics.dual.hardViolations;
  return a;
}, {sameModel:0,dual:0});

await fs.mkdir('benchmark-output', {recursive:true});
await fs.writeFile('benchmark-output/de-muse-qualitative-report.json', JSON.stringify({
  generatedAt:new Date().toISOString(),
  models:{writer:WRITER,editor:EDITOR},
  note:'Qwen editor is a same-model reference, not a claim about current production routing.',
  summary,
  editorialSummary,
  cases:report,
  editorialChallenges:editorialReport
}, null, 2));

let md = `# German Muse qualitative benchmark\n\nWriter: ${WRITER}\n\nEditor candidate: ${EDITOR}\n\nThe Qwen→Qwen column is a same-model reference, not a representation of current production routing.\n\nNarrative hard-violation totals: draft **${summary.draft}**, same-model Qwen editor **${summary.sameModel}**, Qwen→Llama **${summary.dual}**. Empty writer drafts: **${summary.emptyDrafts}**.\n\nEditorial challenge violations: same-model Qwen **${editorialSummary.sameModel}**, Llama editor **${editorialSummary.dual}**.\n\n`;
for (const r of report) {
  md += `## ${r.label} (${r.id})\n\n**Metrics**\n- Draft: ${JSON.stringify(r.metrics.draft)}\n- Same-model Qwen editor: ${JSON.stringify(r.metrics.sameModel)}\n- Qwen→Llama: ${JSON.stringify(r.metrics.dual)}\n\n### Draft\n${r.draft}\n\n### Same-model Qwen editor\n${r.referenceQwenEditor}\n\n### Qwen→Llama\n${r.candidateLlamaEditor}\n\n`;
}
md += `# Editorial challenge set\n\n`;
for (const r of editorialReport) {
  md += `## ${r.label} (${r.id})\n\n**Metrics**\n- Same-model Qwen editor: ${JSON.stringify(r.metrics.sameModel)}\n- Llama editor: ${JSON.stringify(r.metrics.dual)}\n\n### Input draft\n${r.inputDraft}\n\n### Same-model Qwen editor\n${r.referenceQwenEditor}\n\n### Llama editor\n${r.candidateLlamaEditor}\n\n`;
}
await fs.writeFile('benchmark-output/de-muse-qualitative-report.md', md);
console.log(`SUMMARY ${JSON.stringify(summary)} EDITORIAL ${JSON.stringify(editorialSummary)}`);
