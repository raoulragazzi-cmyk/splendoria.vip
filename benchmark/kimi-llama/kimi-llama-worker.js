const MODELS = {
  llama: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  kimi: "@cf/moonshotai/kimi-k2.6"
};

const CASES = [
  {
    id: "rich-350",
    task: "ghostwriter",
    target: [320, 380],
    source: `Fakten: 1978 eröffneten Maria und Josef in Meran ein kleines Geschäft für Haushaltswaren. Maria führte Einkauf und Buchhaltung, Josef stand meist im Laden. 1984 kam Tochter Eva regelmäßig nach der Schule dazu. 1992 zog das Geschäft in größere Räume in der Freiheitsstraße. Die Familie erinnert sich an lange Samstage, handgeschriebene Preislisten und daran, dass Stammkunden oft auf einen Kaffee blieben. 1998 übernahm Eva die operative Leitung. 2004 kam ihr Bruder Lukas in den Betrieb. Keine weiteren Daten oder Motive sind belegt.`,
    instruction: "Schreibe eine zusammenhängende Passage von ungefähr 350 Wörtern. Nutze ausschließlich die Fakten. Keine erfundenen Gefühle, Dialoge, Gerüche, Motive oder Marktbehauptungen. Wenn 350 Wörter nur durch Wiederholung oder Erfindung erreichbar wären, bleibe kürzer."
  },
  {
    id: "sparse-350",
    task: "ghostwriter",
    target: [60, 180],
    source: `Fakten: 1994 zog Paul nach Bozen. Er arbeitete dort zunächst in einer Werkstatt. Mehr ist für diesen Abschnitt nicht dokumentiert.`,
    instruction: "Die UI nennt 350 Wörter als mögliches Ziel. Schreibe dennoch nur so lang, wie die Quellen tragen. Keine erfundenen Details oder Gefühle. Lieber deutlich kürzer als aufgebläht."
  },
  {
    id: "shorten-120",
    task: "editor",
    target: [105, 135],
    source: `Als wir mit dem Projekt begannen, war vieles noch nicht klar. Wir hatten zahlreiche Gespräche, in denen immer wieder dieselben Fragen auftauchten. Manche Entscheidungen wurden vertagt, andere mussten später noch einmal überprüft werden. Trotzdem arbeiteten wir Schritt für Schritt weiter. Wir notierten Ergebnisse, verglichen Angebote, sprachen mit Lieferanten und versuchten, aus den vielen einzelnen Informationen eine Richtung abzuleiten. Rückblickend war diese Phase vor allem deshalb wichtig, weil sie uns zwang, genauer hinzusehen. Wir mussten unterscheiden, was tatsächlich notwendig war und was nur deshalb auf der Liste stand, weil es irgendwann jemand vorgeschlagen hatte. Mit der Zeit wurde der Plan einfacher. Einige Punkte fielen weg, andere wurden konkreter. Am Ende hatten wir keine spektakuläre Lösung, sondern einen Ablauf, den alle verstanden und mittragen konnten.`,
    instruction: "Kürze auf 105 bis 135 Wörter. Erhalte alle eigenständigen Aussagen und den nüchternen Ton. Keine neuen Deutungen."
  },
  {
    id: "quote-byte-exact",
    task: "editor",
    target: [80, 150],
    quote: "„Tu nicht so wichtig, Bub.“",
    source: `Mein Großvater sagte oft: „Tu nicht so wichtig, Bub.“ Der Satz fiel meist dann, wenn ich mich über eine Kleinigkeit aufregte. Ich möchte ihn genau so bewahren. Heute erinnere ich mich vor allem an seine knappe Art zu sprechen und daran, dass er selten lange Erklärungen gab.`,
    instruction: "Glätte nur die Prosa um das direkte Zitat. Das Zitat muss bytegenau unverändert bleiben, einschließlich Anführungszeichen und Zeichensetzung. Keine zusätzlichen Erinnerungen."
  },
  {
    id: "contradiction",
    task: "editor",
    target: [90, 160],
    source: `In meinen Notizen steht, dass wir 1987 nach Innsbruck zogen. Meine Schwester erinnert sich dagegen an 1988. Weitere Unterlagen liegen nicht vor. Sicher ist nur, dass der Umzug vor meinem Schulwechsel stattfand.`,
    instruction: "Formuliere daraus einen natürlichen Absatz. Löse den Widerspruch 1987/1988 nicht auf und erfinde keine Gewissheit."
  },
  {
    id: "already-good",
    task: "editor",
    target: [85, 150],
    source: `Am Morgen nach der Eröffnung war der Laden stiller als erwartet. Auf dem Tresen lagen noch die handgeschriebenen Listen vom Vortag, daneben zwei Tassen. Maria öffnete zuerst die hinteren Fenster, Josef stellte die Kisten vor die Tür. Niemand sprach von einem großen Anfang. Sie machten weiter, wie sie es gewohnt waren: eine Aufgabe nach der anderen. Erst gegen Mittag kamen die ersten Stammkunden. Einige kannten die Familie seit Jahren. Für Maria war das genug. Der Laden musste an diesem Tag nichts beweisen; er musste einfach funktionieren.`,
    instruction: "Der Text ist bereits gut. Ändere nur etwas, wenn Grammatik, Klarheit oder Rhythmus es wirklich erfordern. Keine stilistische Selbstdarstellung."
  }
];

function textFrom(result) {
  if (typeof result?.response === "string") return result.response;
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(x => x?.text || "").join("");
  return "";
}
function wc(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

async function call(env, modelKey, c) {
  const model = MODELS[modelKey];
  const system = c.task === "editor"
    ? "Du bist ein konservativer deutschsprachiger Lektor. Fakten und Stimme haben Vorrang vor Eleganz. Befolge Längenangaben, ohne Informationen zu erfinden."
    : "Du bist ein professioneller deutschsprachiger Ghostwriter. Schreibe idiomatisches DACH-Deutsch, aber erfinde niemals Fakten, Gefühle, Dialoge, Sinneseindrücke oder Kausalitäten.";
  const input = {
    messages: [
      { role: "system", content: system + "\n" + c.instruction },
      { role: "user", content: c.source }
    ],
    temperature: 0.15,
    max_completion_tokens: 900
  };
  if (modelKey === "kimi") input.chat_template_kwargs = { thinking: false };
  const start = Date.now();
  try {
    const result = await env.AI.run(model, input);
    const text = textFrom(result).trim();
    return {
      ok: Boolean(text),
      model,
      ms: Date.now() - start,
      words: wc(text),
      withinTarget: wc(text) >= c.target[0] && wc(text) <= c.target[1],
      quotePreserved: c.quote ? text.includes(c.quote) : null,
      has1987: c.id === "contradiction" ? /1987/.test(text) : null,
      has1988: c.id === "contradiction" ? /1988/.test(text) : null,
      text
    };
  } catch (error) {
    return { ok: false, model, ms: Date.now() - start, error: String(error?.message || error), text: "" };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") return Response.json({ status: "ok" });
    if (url.pathname !== "/run") return new Response("not found", { status: 404 });
    const results = [];
    for (const c of CASES) {
      const row = { id: c.id, task: c.task, target: c.target, source: c.source };
      row.llama = await call(env, "llama", c);
      row.kimi = await call(env, "kimi", c);
      results.push(row);
    }
    return Response.json({ generatedAt: new Date().toISOString(), models: MODELS, cases: results });
  }
};