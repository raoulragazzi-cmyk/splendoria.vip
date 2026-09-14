import legalWorker from "./i18n-legal-worker.js";

const LOCALIZED_PUBLIC = new Set([
  "/", "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"
]);

function routeLocale(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  return match ? { locale: match[1], basePath: match[2] || "/" } : null;
}

function keepPublicLinksInLocale(html, locale) {
  const prefix = `/${locale}`;
  let out = html.replace(/href="\/(guida|privacy-policy|cookie-policy|termini-condizioni|note-legali|trasparenza-ai)"/g, `href="${prefix}/$1"`);
  out = out.replace(/href="\/\#(metodo|formule|contatti)"/g, `href="${prefix}/#$1"`);
  return out;
}

function polishLegalLabels(html, locale, basePath) {
  let out = html;
  if (locale === "de") {
    out = out.split("Partita IVA").join("USt-IdNr.");
    out = out.split("Email:").join("E-Mail:");
    if (basePath === "/privacy-policy") out = out.split("Privacy Policy").join("Datenschutzerklärung");
  } else {
    out = out.split("Partita IVA").join("VAT number");
  }
  return out;
}

function polishGuideMarkup(html, locale, basePath) {
  if (basePath !== "/guida") return html;
  let out = html;
  if (locale === "de") {
    out = out
      .split("Controlla sempre nomi, date, luoghi, citazioni, relazioni e ordine degli eventi. Poi usa ").join("Prüfe immer Namen, Daten, Orte, Zitate, Beziehungen und die Reihenfolge der Ereignisse. Verwende anschließend ")
      .split("<strong>“Correggi grammatica”</strong>").join("<strong>„Grammatik korrigieren“</strong>")
      .split(": il revisore interviene su ortografia, sintassi, concordanze, reggenze e punteggiatura, conservando fatti e voce.").join(": Die Überarbeitung verbessert Rechtschreibung, Syntax, grammatische Übereinstimmung, Rektion und Zeichensetzung, ohne Fakten oder Stimme zu verändern.")
      .split("Splendoria applica un controllo specifico sugli ausiliari italiani: scrive, per esempio, ").join("Wenn das Buch auf Italienisch geschrieben wird, prüft Splendoria zusätzlich die korrekte Verwendung italienischer Hilfsverben – zum Beispiel ")
      .split("<em>“siamo usciti”</em> e <em>“siamo andati”</em>, mai <em>“abbiamo uscito”</em> o <em>“abbiamo andato”</em>.").join("<em>„siamo usciti“</em> und <em>„siamo andati“</em>, niemals <em>„abbiamo uscito“</em> oder <em>„abbiamo andato“</em>.")
      .split("Se una revisione non supera il controllo di fedeltà, il testo originale resta intatto e compare un avviso.").join("Besteht eine Überarbeitung die Treueprüfung nicht, bleibt der Originaltext unverändert und es erscheint ein Hinweis.")
      .split("Infine apri ").join("Öffne anschließend ")
      .split("<strong>“Sfoglia l’anteprima”</strong>").join("<strong>„Vorschau durchblättern“</strong>")
      .split(". Il comando di stampa del browser permette di salvare l’opera in PDF A5; usa scala 100% e disattiva intestazioni e piè di pagina.").join(". Über den Druckdialog des Browsers kannst du das Werk als A5-PDF speichern; verwende 100 % Skalierung und deaktiviere Kopf- und Fußzeilen.");
  } else {
    out = out
      .split("Controlla sempre nomi, date, luoghi, citazioni, relazioni e ordine degli eventi. Poi usa ").join("Always check names, dates, places, quotations, relationships and the order of events. Then use ")
      .split("<strong>“Correggi grammatica”</strong>").join("<strong>“Correct grammar”</strong>")
      .split(": il revisore interviene su ortografia, sintassi, concordanze, reggenze e punteggiatura, conservando fatti e voce.").join(": the reviewer works on spelling, syntax, agreement, grammar and punctuation while preserving facts and voice.")
      .split("Splendoria applica un controllo specifico sugli ausiliari italiani: scrive, per esempio, ").join("When the book is written in Italian, Splendoria also applies a specific check to Italian auxiliary verbs—for example, ")
      .split("<em>“siamo usciti”</em> e <em>“siamo andati”</em>, mai <em>“abbiamo uscito”</em> o <em>“abbiamo andato”</em>.").join("<em>“siamo usciti”</em> and <em>“siamo andati”</em>, never <em>“abbiamo uscito”</em> or <em>“abbiamo andato”</em>.")
      .split("Se una revisione non supera il controllo di fedeltà, il testo originale resta intatto e compare un avviso.").join("If a revision fails the fidelity check, the original text remains unchanged and a warning is shown.")
      .split("Infine apri ").join("Finally, open ")
      .split("<strong>“Sfoglia l’anteprima”</strong>").join("<strong>“Browse preview”</strong>")
      .split(". Il comando di stampa del browser permette di salvare l’opera in PDF A5; usa scala 100% e disattiva intestazioni e piè di pagina.").join(". Your browser’s print command lets you save the work as an A5 PDF; use 100% scale and turn off headers and footers.");
  }
  return out;
}

async function fetchEntry(request, env, ctx) {
  const response = await legalWorker.fetch(request, env, ctx);
  if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const route = routeLocale(new URL(request.url).pathname);
  if (!route || !LOCALIZED_PUBLIC.has(route.basePath)) return response;
  let html = await response.text();
  html = keepPublicLinksInLocale(html, route.locale);
  html = polishLegalLabels(html, route.locale, route.basePath);
  html = polishGuideMarkup(html, route.locale, route.basePath);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  fetch: fetchEntry,
  email(message, env, ctx) { return legalWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return legalWorker.scheduled(controller, env, ctx); }
};
