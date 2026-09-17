import fs from 'node:fs/promises';

const cases = JSON.parse(await fs.readFile('test/fixtures/de-muse-fact-check-challenges.json', 'utf8'));
const benchmarkUrl = String(process.env.BENCHMARK_URL || '').replace(/\/$/, '');
const benchToken = process.env.BENCH_TOKEN;
if (!benchmarkUrl || !benchToken) throw new Error('Missing isolated benchmark URL/token');

const MODELS = [
  '@cf/qwen/qwen3.8-27b',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
];
const system = `Du bist ausschließlich die Fakten- und Quellenkontrolle von Splendoria. Vergleiche TEXT nur mit QUELLEN. Plausibilität ist kein Beleg. Jede konkrete Aussage, Interpretation, Emotion, Kausalität, Bedeutung oder direkte Rede, die nicht durch die Quellen gedeckt ist, macht den Text nicht freigabefähig. Widersprüche und Unsicherheiten in den Quellen müssen erhalten bleiben. Direkte Zitate müssen in Wortlaut und Bedeutung mit der Quelle übereinstimmen. Antworte exakt mit APPROVATO, wenn alle konkreten Aussagen gedeckt sind, sonst exakt mit RIFIUTATO. Keine Erklärung.`;

async function run(model, c) {
  const res = await fetch(`${benchmarkUrl}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${benchToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role:'system', content:system },
        { role:'user', content:`QUELLEN:\n${c.source}\n\nTEXT:\n${c.text}` }
      ],
      temperature:0,
      max_tokens:24
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(`${model} failed: HTTP ${res.status} ${JSON.stringify(body).slice(0,800)}`);
  const result = body.result || {};
  return String(result.response ?? result?.choices?.[0]?.message?.content ?? result.text ?? '').trim();
}

const results=[];
for (const c of cases) {
  const row={id:c.id,expected:c.expected,source:c.source,text:c.text,models:{}};
  for (const model of MODELS) {
    const output=await run(model,c);
    row.models[model]={output,pass:output===c.expected};
    console.log(`${c.id} ${model}: expected=${c.expected} got=${output} pass=${output===c.expected}`);
  }
  results.push(row);
}
const scores=Object.fromEntries(MODELS.map(model=>[model,results.filter(r=>r.models[model].pass).length]));
await fs.mkdir('benchmark-output',{recursive:true});
await fs.writeFile('benchmark-output/de-muse-fact-check-report.json',JSON.stringify({generatedAt:new Date().toISOString(),scores,total:cases.length,results},null,2));
let md=`# German Muse factual verdict benchmark\n\nTotal cases: ${cases.length}\n\n`;
for (const model of MODELS) md+=`- ${model}: **${scores[model]}/${cases.length}**\n`;
for (const r of results) {
  md+=`\n## ${r.id}\nExpected: **${r.expected}**\n\n`;
  for (const model of MODELS) md+=`- ${model}: ${r.models[model].output} — ${r.models[model].pass?'PASS':'FAIL'}\n`;
}
await fs.writeFile('benchmark-output/de-muse-fact-check-report.md',md);
if (Object.values(scores).every(score=>score===0)) process.exitCode=1;
