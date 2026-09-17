import fs from 'node:fs/promises';

const cases = JSON.parse(await fs.readFile('test/fixtures/de-muse-qualitative-cases.json', 'utf8'));
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

const writerSystem = `Du bist Splendorias deutscher Ghostwriter. Schreibe modernes, idiomatisches Standarddeutsch für den DACH-Raum. Absolute Prioritäten: Fakten- und Quellenbindung, Stimme des Autors, Natürlichkeit, dann Stil. Erfinde keine Namen, Daten, Orte, Beziehungen, Dialoge, Gefühle, Motive, Sinneseindrücke, Ursachen oder Details. Bewahre Unsicherheit und Widersprüche sichtbar. Regionale Ausdrücke und Zitate aus den Quellen bleiben unverändert. Wenn Material dünn ist, schreibe kürzer statt aufzufüllen. Keine KI-Floskeln, keine Werbung, kein Pathos.`;
const editorSystem = `Du bist Splendorias deutscher Lektor und Stilredakteur. Überarbeite den gelieferten Entwurf konservativ. Bewahre alle Fakten, Unsicherheiten, Zitate, regionale Formen, Perspektive und die erkennbare Stimme. Entferne nur sprachliche Härten, Wiederholungen, Bürokratendeutsch, generische KI-Muster und unnötiges Pathos. Füge keinerlei neue Tatsachen, Bilder, Emotionen, Motive oder Sinneseindrücke hinzu. Ein bereits guter Satz darf unverändert bleiben. Gib ausschließlich den finalen Text zurück.`;

function metrics(text, c) {
  const lower = text.toLocaleLowerCase('de-DE');
  const missing = c.mustKeep.filter(x => !lower.includes(String(x).toLocaleLowerCase('de-DE')));
  const forbidden = c.mustNotAdd.filter(x => lower.includes(String(x).toLocaleLowerCase('de-DE')));
  const aiCliches = ['nicht nur', 'sondern auch', 'es war mehr als', 'prägte mich', 'tief in mir', 'ein kapitel meines lebens', 'bis heute begleitet'];
  const cliches = aiCliches.filter(x => lower.includes(x));
  return {
    words: text.split(/\s+/).filter(Boolean).length,
    missing,
    forbidden,
    cliches,
    hardViolations: missing.length + forbidden.length
  };
}

const report = [];
for (const c of cases) {
  const user = `QUELLEN:\n${c.source}\n\nAUFGABE:\n${c.task}\n\nSTIMME:\n${c.voice}`;
  const draft = await run(WRITER, [{role:'system', content: writerSystem},{role:'user', content:user}], 0.32, 850);
  const baseline = await run(WRITER, [{role:'system', content: editorSystem},{role:'user', content:`QUELLEN:\n${c.source}\n\nENTWURF:\n${draft}`}], 0.18, 850);
  const dual = await run(EDITOR, [{role:'system', content: editorSystem},{role:'user', content:`QUELLEN:\n${c.source}\n\nENTWURF:\n${draft}`}], 0.18, 850);
  report.push({ id:c.id, label:c.label, source:c.source, task:c.task, voice:c.voice, draft, baselineQwenQwen:baseline, candidateQwenLlama:dual, metrics:{draft:metrics(draft,c), baseline:metrics(baseline,c), dual:metrics(dual,c)} });
  console.log(`CASE ${c.id}`);
  console.log(`draft violations=${metrics(draft,c).hardViolations}, baseline=${metrics(baseline,c).hardViolations}, dual=${metrics(dual,c).hardViolations}`);
}

const summary = report.reduce((a,r) => {
  a.draft += r.metrics.draft.hardViolations;
  a.baseline += r.metrics.baseline.hardViolations;
  a.dual += r.metrics.dual.hardViolations;
  return a;
}, {draft:0,baseline:0,dual:0});

await fs.mkdir('benchmark-output', {recursive:true});
await fs.writeFile('benchmark-output/de-muse-qualitative-report.json', JSON.stringify({ generatedAt:new Date().toISOString(), models:{writer:WRITER,editor:EDITOR}, summary, cases:report }, null, 2));
let md = `# German Muse qualitative benchmark\n\nWriter: ${WRITER}\n\nEditor candidate: ${EDITOR}\n\nHard-violation totals: draft **${summary.draft}**, Qwen→Qwen **${summary.baseline}**, Qwen→Llama **${summary.dual}**.\n\n`;
for (const r of report) {
  md += `## ${r.label} (${r.id})\n\n**Metrics**\n- Draft: ${JSON.stringify(r.metrics.draft)}\n- Qwen→Qwen: ${JSON.stringify(r.metrics.baseline)}\n- Qwen→Llama: ${JSON.stringify(r.metrics.dual)}\n\n### Qwen→Qwen\n${r.baselineQwenQwen}\n\n### Qwen→Llama\n${r.candidateQwenLlama}\n\n`;
}
await fs.writeFile('benchmark-output/de-muse-qualitative-report.md', md);
console.log(`SUMMARY ${JSON.stringify(summary)}`);
