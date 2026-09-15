import studioWorker from "./studio-language-worker.js";

const LOCALES = new Set(["de", "en"]);

const DE_RUNTIME_PAIRS = [
  ["Torna all’inizio della pagina", "Zum Seitenanfang"],
  ["<span>Torna su</span>", "<span>Nach oben</span>"],
  ["Se non sai da dove partire, puoi raccontare:", "Wenn du nicht weißt, wo du anfangen sollst, kannst du erzählen über:"],
  ["['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato']", "['Kindheit','Familie','Schule','Erste Liebe','Freundschaften','Arbeit','Prägende Begegnungen','Reisen','Wendepunkte','Verluste','Erfolge','Menschen, die dich verändert haben']"],
  ["<strong>Prima di usare la Musa:</strong> servono almeno <b>50 parole di spunto complessive</b> nelle tre sezioni. Non devi scriverne 350: circa 350 è la lunghezza che la Musa può sviluppare per una singola sezione.", "<strong>Bevor du die Muse einsetzt:</strong> brauchst du in den drei Abschnitten zusammen mindestens <b>50 Wörter als Ausgangsmaterial</b>. Du musst nicht 350 Wörter selbst schreiben: Etwa 350 Wörter sind die Länge, die die Muse für einen einzelnen Abschnitt ausarbeiten kann."],
  ["['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.']", "['1. Einstieg', 'Öffne die Szene: Wo sind wir, wer ist da und was steht unmittelbar bevor?']"],
  ["['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.']", "['2. Entwicklung', 'Erzähle von Ereignissen, Handlungen, Dialogen, Wendepunkten und Folgen.']"],
  ["['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.']", "['3. Abschluss', 'Schließe den Erzählbogen: Was verändert sich, was bleibt und wohin führt es?']"],
  ["Inizia dalla scena o dal ricordo che apre il capitolo…", "Beginne mit der Szene oder Erinnerung, die das Kapitel eröffnet…"],
  ["Sviluppa ciò che accade e ciò che cambia…", "Entfalte, was geschieht und was sich verändert…"],
  ["Porta il capitolo a una conclusione naturale…", "Führe das Kapitel zu einem natürlichen Abschluss…"],
  ["Affidati alla Musa per questa sezione", "Diesen Abschnitt der Muse anvertrauen"],
  ["' parole scritte · Musa: circa '", "' Wörter geschrieben · Muse: etwa '"],
  ["<strong>Musa pronta:</strong> hai ", "<strong>Muse bereit:</strong> Du hast "],
  [" parole di spunto complessive. Circa 350 parole è l’obiettivo di scrittura della Musa per ciascuna sezione, non un minimo da digitare.", " Wörter Ausgangsmaterial insgesamt. Etwa 350 Wörter sind das Schreibziel der Muse pro Abschnitt, nicht die Mindestmenge, die du eingeben musst."],
  ["<strong>Prima di usare la Musa:</strong> hai ", "<strong>Bevor du die Muse einsetzt:</strong> Du hast "],
  [" parole di spunto; ne servono almeno <b>50</b> complessive. Te ne mancano ", " Wörter Ausgangsmaterial; insgesamt werden mindestens <b>50</b> benötigt. Es fehlen noch "],
  [". Non devi scriverne 350: quello è l’obiettivo della Musa per una sezione.", ". Du musst nicht 350 Wörter selbst schreiben: Das ist das Schreibziel der Muse für einen Abschnitt."],
  ["Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.", "Die zuletzt gespeicherte Buchversion wiederherstellen? Der aktuelle Stand wird als vorherige Version gesichert, sodass du bei Bedarf zurückkehren kannst."],
  ["Metto al sicuro le tue parole…", "Ich sichere deine Worte…"],
  ["Non sono riuscita a salvare in sicurezza ciò che hai scritto. Le tue parole restano qui: riprova tra un momento.", "Ich konnte deinen Text nicht sicher speichern. Deine Worte bleiben hier erhalten; versuche es in einem Moment erneut."]
];

const DE_HTML_PAIRS = [
  ["Il tuo posto nella storia", "Dein Platz in der Geschichte"],
  ["Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui.", "Mach dort weiter, wo du aufgehört hast: Deine Geschichte wartet hier auf dich."],
  ["La storia si sta facendo più nitida.", "Deine Geschichte gewinnt an Klarheit."],
  ["Stai scrivendo qui", "Hier schreibst du gerade"],
  ["Titolo del capitolo • puoi rinominarlo in qualsiasi momento", "Kapiteltitel • jederzeit umbenennbar"],
  ["Titolo del capitolo · puoi rinominarlo in qualsiasi momento", "Kapiteltitel · jederzeit umbenennbar"]
];

const DE_BRAIN_CONTRACT = `VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE — DEUTSCH (HOCHDEUTSCH)
- Verfasse alle neu erzeugten narrativen Texte, Kapitelüberschriften, Gliederungen, Interviewfragen und redaktionellen Vorschläge in natürlichem, idiomatischem Standarddeutsch.
- Vermeide wörtliche Übertragungen italienischer Satzmuster. Schreibe wie eine deutschsprachige Autorin bzw. ein deutschsprachiger Lektor: klar, elegant, rhythmisch und ungekünstelt.
- Beachte deutsche Grammatik, Kasus, Genus, Deklination, Verbposition, trennbare Verben, Präpositionen, Zeichensetzung und konsistente Zeitformen.
- Fakten, Namen, Zahlen, Orte, Chronologie und vom Autor gelieferte Details dürfen nicht erfunden, erweitert oder verfälscht werden.
- Originalzitate und bewusst fremdsprachige Passagen bleiben in ihrer Ausgangssprache, sofern keine Übersetzung ausdrücklich verlangt wird.
- Die Stimme des Autors hat Vorrang vor stilistischer Glättung. Dialekt oder regionale Färbung nur beibehalten, wenn sie aus den Quellen stammt oder ausdrücklich gewünscht ist.
- Technische Tokens und maschinenlesbare Kontrollwerte bleiben exakt unverändert.`;

function replacePairs(value, pairs) {
  let out = String(value || "");
  for (const [source, target] of pairs) out = out.split(source).join(target);
  return out;
}

function protectAuthored(html) {
  const stash = [];
  const token = value => `__SPL_DEEP_AUTHORED_${stash.push(String(value)) - 1}__`;
  let out = String(html || "");
  out = out.replace(/(<textarea\b[^>]*>)([\s\S]*?)(<\/textarea>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  out = out.replace(/(<input\b[^>]*\bvalue=")([^"]*)(")/gi, (_m, open, value, close) => `${open}${token(value)}${close}`);
  out = out.replace(/(<div class="live-page-copy"[^>]*>)([\s\S]*?)(<\/div>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  return {
    html: out,
    restore(value) {
      return String(value || "").replace(/__SPL_DEEP_AUTHORED_(\d+)__/g, (_m, index) => stash[Number(index)] ?? _m);
    }
  };
}

export function localizeDeepStudioHtml(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");
  if (locale !== "de") return String(html || "");
  const protectedHtml = protectAuthored(html);
  let out = replacePairs(protectedHtml.html, DE_HTML_PAIRS);
  out = out.replace(/(\d[\d.,]*) parole · ([\d.,]+) pagine stimate/g, "$1 Wörter · $2 geschätzte Seiten");
  out = out.replace(/Obiettivo: circa ([\d.,]+) pagine · ([\d.,]+) parole/g, "Ziel: etwa $1 Seiten · $2 Wörter");
  return protectedHtml.restore(out);
}

export function localizeDeepStudioScript(source, locale) {
  let out = String(source || "");
  if (!LOCALES.has(locale)) return out;
  if (locale !== "de") return out;
  out = replacePairs(out, DE_RUNTIME_PAIRS);
  out = out.replace("targetLine.match(/([\\d.\\s]+)\\s*parole/i)", "targetLine.match(/([\\d.,\\s]+)\\s*(?:parole|Wörter)/i)");
  out = out.replace("window.location.pathname.match(/^\\/libro\\/([^/]+)/)", "window.location.pathname.match(/^\\/(?:(?:de|en)\\/)?libro\\/([^/]+)/)");
  return out;
}

function containsGermanMuseDirective(options) {
  const values = [];
  if (typeof options?.prompt === "string") values.push(options.prompt);
  if (Array.isArray(options?.messages)) {
    for (const message of options.messages) if (message?.role === "system" && typeof message.content === "string") values.push(message.content);
  }
  return values.some(value => /LINGUA DELL'OPERA:\s*TEDESCO/i.test(value));
}

export function strengthenMuseOptions(options) {
  if (!containsGermanMuseDirective(options) || !options || typeof options !== "object") return options;
  const out = { ...options };
  if (Array.isArray(options.messages)) {
    out.messages = options.messages.map(message => {
      if (!message || message.role !== "system" || typeof message.content !== "string") return message;
      if (message.content.includes("VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE")) return message;
      return { ...message, content: `${DE_BRAIN_CONTRACT}\n\n${message.content}` };
    });
  }
  if (typeof options.prompt === "string" && !options.prompt.includes("VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE")) {
    out.prompt = `${DE_BRAIN_CONTRACT}\n\n${options.prompt}`;
  }
  return out;
}

function deepBrainEnv(env) {
  if (!env?.AI?.run) return env;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  const binding = env.AI;
  wrapped.AI = {
    run(model, options) {
      return binding.run(model, strengthenMuseOptions(options));
    }
  };
  return wrapped;
}

function localeFromPrivatePath(pathname) {
  return pathname.match(/^\/(de|en)\/(?:studio|account(?:\/|$)|libro(?:\/|$))/)?.[1] || "";
}

async function deepFetch(request, env, ctx) {
  const url = new URL(request.url);
  const response = await studioWorker.fetch(request, deepBrainEnv(env), ctx);
  if (!response.ok) return response;
  const type = response.headers.get("content-type") || "";

  const scriptLocale = url.pathname === "/assets/studio.js" && LOCALES.has(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "";
  if (scriptLocale && type.includes("javascript")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeDeepStudioScript(await response.text(), scriptLocale), { status: response.status, statusText: response.statusText, headers });
  }

  const locale = localeFromPrivatePath(url.pathname);
  if (request.method === "GET" && locale && type.includes("text/html")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control", "private, no-store, max-age=0");
    headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return new Response(localizeDeepStudioHtml(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
  }

  return response;
}

export default {
  fetch: deepFetch,
  email(message, env, ctx) { return studioWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return studioWorker.scheduled(controller, env, ctx); }
};
