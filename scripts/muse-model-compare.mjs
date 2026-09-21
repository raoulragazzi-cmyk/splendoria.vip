import fs from 'node:fs';
import { CASES } from '../benchmark/muse-model-cases.mjs';

const baseUrl = process.env.BENCH_URL;
if (!baseUrl) throw new Error('BENCH_URL missing');

const MODELS = {
  llama: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  kimi: '@cf/moonshotai/kimi-k2.6'
};

const CURRENT = `Du bist ein konservativer deutschsprachiger Lektor von Splendoria.
Verbessere Klarheit, Rhythmus und Präzision moderat. Bewahre Eigenart, Perspektive und Stimme des Autors.
Erfinde keine Fakten, Gefühle, Motive, Sinneseindrücke, Ursachen oder Folgen. Direkte Zitate bleiben exakt unverändert.
Entferne unbelegte Wertungen statt sie eleganter zu formulieren. Gib ausschließlich den redigierten Text zurück.`;

const V3 = (targetWords) => `Du bist die deutschsprachige Stilredaktion von Splendoria. Deine Aufgabe ist präzise, konservative Buchredaktion, nicht Neuschreiben.

PRIORITÄTEN:
1. Fakten- und Quellen­treue.
2. Stimme, Alter, Register und Erzählperspektive des Autors.
3. Natürliches gegenwärtiges Standarddeutsch für DACH/Südtirol, ohne künstliche Regionalismen.
4. Rhythmus, Klarheit und Eleganz.
5. Länge.

STILVERTRAG:
- Erhalte charakteristische einfache, kantige oder persönliche Formulierungen, wenn sie verständlich sind.
- Keine Werbesprache, kein Pathos, keine KI-Floskeln, keine künstlichen Schlussfolgerungen.
- Keine neuen Gefühle, Motive, Szenen, Dialoge, Gerüche, Farben, Gesten, Kausalitäten oder Erfolge.
- Direkte Zitate bleiben bytegetreu unverändert, einschließlich Anführungszeichen und Zeichensetzung.
- Widersprüche und Unsicherheiten bleiben sichtbar; löse sie nicht erfinderisch auf.
- Wenn der Text bereits gut ist, ändere so wenig wie möglich.

LÄNGENVERTRAG:
- Ziel: ungefähr ${targetWords} Wörter, Toleranz ±10 %, aber Fakten- und Quellentreue haben Vorrang.
- Bei zu wenig Material NICHT auffüllen. Ein kürzerer wahrer Text ist besser als ein längerer erfundener.
- Beim Kürzen zuerst Wiederholungen, Umwege und Füllwörter entfernen; keine eigenständigen Fakten streichen.
- Keine Meta-Erklärung. Gib ausschließlich den redigierten Text zurück.`;

function words(s){ return String(s||'').trim().split(/\s+/).filter(Boolean).length; }
function containsCI(text, needle){ return text.toLocaleLowerCase('de-DE').includes(String(needle).toLocaleLowerCase('de-DE')); }

async function runOne(label, model, mode, testCase) {
  const system = mode === 'v3' ? V3(testCase.targetWords) : CURRENT;
  const response = await fetch(baseUrl + '/run', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({ model, system, user:testCase.source, maxTokens:1800 })
  });
  const result = await response.json();
  const text = result.text || '';
  const wc = words(text);
  const lower = text.toLocaleLowerCase('de-DE');
  const quotePass = testCase.exactQuotes.every(q => text.includes(q));
  const factsPass = testCase.mustContain.every(x => containsCI(text,x));
  const forbiddenHits = testCase.forbidden.filter(x => containsCI(text,x));
  const lo = Math.floor(testCase.targetWords * .9), hi = Math.ceil(testCase.targetWords * 1.1);
  return {
    case:testCase.id, label, model, mode, ok:result.ok, error:result.error||null,
    elapsedMs:result.elapsedMs, usage:result.usage||null,
    sourceWords:words(testCase.source), targetWords:testCase.targetWords, outputWords:wc,
    lengthBand:[lo,hi], lengthPass:wc>=lo&&wc<=hi,
    quotePass, factsPass, forbiddenHits,
    text
  };
}

const health=await fetch(baseUrl+'/healthz').then(r=>r.json());
if(health.status!=='ok') throw new Error('benchmark worker unhealthy');

const results=[];
for (const testCase of CASES) {
  for (const [label,model] of Object.entries(MODELS)) {
    for (const mode of ['current','v3']) {
      results.push(await runOne(label,model,mode,testCase));
    }
  }
}
const summary={};
for(const label of Object.keys(MODELS)) for(const mode of ['current','v3']){
  const rows=results.filter(r=>r.label===label&&r.mode===mode);
  summary[label+'_'+mode]={
    calls:rows.length,
    ok:rows.filter(r=>r.ok).length,
    avgElapsedMs:Math.round(rows.reduce((s,r)=>s+(r.elapsedMs||0),0)/Math.max(1,rows.length)),
    lengthPass:rows.filter(r=>r.lengthPass).length,
    factsPass:rows.filter(r=>r.factsPass).length,
    quotePass:rows.filter(r=>r.quotePass).length,
    forbiddenClean:rows.filter(r=>r.forbiddenHits.length===0).length,
    avgAbsTargetDelta:Math.round(rows.reduce((s,r)=>s+Math.abs(r.outputWords-r.targetWords),0)/Math.max(1,rows.length))
  };
}
const report={generatedAt:new Date().toISOString(),health,summary,results};
fs.mkdirSync('benchmark-output',{recursive:true});
fs.writeFileSync('benchmark-output/muse-model-compare.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(summary,null,2));
for(const r of results) console.log([r.case,r.label,r.mode,r.ok?'ok':'FAIL',r.outputWords+'w',r.elapsedMs+'ms','facts='+r.factsPass,'quotes='+r.quotePass,'forbidden='+r.forbiddenHits.join('|')].join('\t'));
