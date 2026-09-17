const WRITER = '@cf/qwen/qwen3.8-27b';
const EDITOR = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const cases = [
  { id:'suedtirol-regionality', label:'Südtirol / regionalità', source:'Ich bin 1954 in Kaltern geboren. Mein Vater sagte immer „auf die Marende gehen“. Zu Hause sprachen wir Deutsch, mit Kunden oft Italienisch. 1972 begann ich im kleinen Lebensmittelgeschäft meiner Tante in Bozen zu arbeiten. Mehr weiß ich über diesen ersten Tag nicht sicher.', risks:['Marende invariata','nessun dettaglio inventato sul primo giorno','bilinguismo naturale'] },
  { id:'elderly-voice', label:'Voce anziana', source:'Also, ich weiß nicht mehr genau, wann das war. Vielleicht 1968, vielleicht ein Jahr später. Wir hatten nicht viel. Meine Mutter nähte, mein Vater war oft weg wegen der Arbeit. Ich sage immer: Es war kein Unglück, aber leicht war es auch nicht.', risks:['voce non troppo letteraria','incertezza preservata','nessuna drammatizzazione'] },
  { id:'company-biography', label:'Biografia aziendale', source:'Die Firma wurde 1987 von Anna Berger und ihrem Bruder Paul gegründet. Begonnen hat alles mit drei Mitarbeitern in Meran. 1994 kam der erste größere Auftrag aus Österreich. 2008 zog die Produktion nach Lana. Anna sagt: „Wir wollten nie die Größten sein, sondern verlässlich bleiben.“', risks:['niente tono pubblicitario','date e nomi invariati','nessuna strategia inventata'] },
  { id:'fragmented-memory', label:'Memoria frammentaria', source:'Bahnhof. Ein roter Koffer, glaube ich. Meine Schwester war dabei, oder sie kam später nach. Wir fuhren nach München. Ich erinnere mich an die Kälte, aber nicht an den Monat. Es muss nach der Schule gewesen sein. Mehr bekomme ich nicht zusammen.', risks:['ipotesi restano ipotesi','frammentarietà preservata','nessun mese/scena/dialogo inventato'] },
  { id:'sparse-data', label:'Pochi dati', source:'1963 Umzug nach Brixen. Neue Schule. Vater arbeitete bei der Bahn. Ich war neun.', risks:['testo breve','niente atmosfera inventata','nessun dettaglio familiare aggiunto'] },
  { id:'contradiction', label:'Contraddizione', source:'Notiz A: „Wir eröffneten das Geschäft 1978.“ Notiz B: „Die Eröffnung war im Frühjahr 1979.“ Der Autor sagt heute: „Ich bin mir beim Jahr nicht mehr sicher.“ Sicher ist nur: Das Geschäft war vor 1980 offen.', risks:['non scegliere 1978/1979','incertezza esplicita','unico fatto certo: prima del 1980'] },
  { id:'quotation-integrity', label:'Citazione', source:'Meine Großmutter sagte wörtlich: „Tu nicht so wichtig, Bub.“ Diesen Satz möchte ich genau so im Buch behalten. Sonst erinnere ich mich nur daran, dass sie wenig sprach und sehr direkt war.', risks:['citazione esatta','parlato non corretto','nessuna nuova frase attribuita'] },
  { id:'already-good', label:'Testo già buono', source:'Im Winter lag der Hof früh im Schatten. Mein Vater kam meist schweigend aus dem Stall, stellte die Stiefel neben die Tür und setzte sich an den Küchentisch. Wir mussten nicht viel reden. Dass er da war, genügte.', risks:['intervento minimo','niente sinonimi ornamentali','voce preservata'] }
];

const writerSystem = `PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH\nINTERNE REDAKTION SPLENDORIA — DEUTSCH\nROLLE — GHOSTWRITER\nSchreibe aus dem freigegebenen Material einen kurzen, zusammenhängenden autobiografischen Abschnitt in natürlichem zeitgenössischem Standarddeutsch. Quellen und gelieferte Fakten sind die absolute Grenze des Erfindbaren. Ergänze keine Dialoge, Gedanken, Motive, Sinneseindrücke, Daten, Orte oder Kausalitäten, die nicht belegt sind. Bewahre regionale Begriffe, Unsicherheiten und charakteristische Formulierungen. Wenn das Material dünn ist, schreibe kürzer statt Lücken zu füllen. Keine Überschrift, keine Erklärung.`;
const editorSystem = `INTERNE REDAKTION SPLENDORIA — DEUTSCH\nROLLE — LEKTOR UND STILREDAKTION\nÜberarbeite den folgenden deutschen Text konservativ. Verbessere nur Grammatik, Idiomatik, Rhythmus, Präzision und offensichtliche KI-Muster. Bewahre alle Fakten, Unsicherheiten, Zitate, Regionalismen, Perspektive und Eigenheiten der Stimme. Erfinde nichts. Wenn der Text bereits gut ist, ändere so wenig wie möglich. Keine Erklärung, nur den finalen Text.`;

function textOf(result) {
  const value = result?.response ?? result?.output_text ?? result?.result ?? result;
  return typeof value === 'string' ? value.trim() : JSON.stringify(value);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/healthz') return Response.json({status:'ok', ai:!!env.AI});
    if (url.pathname !== '/benchmark' || request.method !== 'POST') return new Response('Not found', {status:404});
    const results=[];
    for (const item of cases) {
      const writerRaw = await env.AI.run(WRITER, {messages:[{role:'system',content:writerSystem},{role:'user',content:`QUELLE:\n${item.source}`}],temperature:0.35,max_tokens:900,enable_thinking:false});
      const qwen=textOf(writerRaw);
      const editorRaw = await env.AI.run(EDITOR, {messages:[{role:'system',content:editorSystem},{role:'user',content:`AUTORISIERTE QUELLE:\n${item.source}\n\nZU REDIGIERENDER TEXT:\n${qwen}`}],temperature:0.2,max_tokens:900});
      const llama=textOf(editorRaw);
      results.push({...item, writerModel:WRITER, editorModel:EDITOR, qwen, llama});
    }
    return Response.json({generatedAt:new Date().toISOString(), results});
  }
};
