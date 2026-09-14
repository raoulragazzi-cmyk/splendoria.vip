import editorWorker from "./i18n-editor-safe-worker.js";

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

function replacePlanDescriptions(html, locale) {
  const pairs = locale === "de" ? [
    ["Fino a 100 pagine · 12 capitoli · percorso digitale guidato dalle Muse e PDF A5 pronto per la stampa.", "Bis zu 100 Seiten · 12 Kapitel · digitaler, von den Musen geführter Weg und druckfertiges A5-PDF."],
    ["Fino a 120 pagine · 18 capitoli · percorso approfondito con revisione editoriale e PDF A5 pronto per la stampa.", "Bis zu 120 Seiten · 18 Kapitel · vertiefter Weg mit redaktioneller Überarbeitung und druckfertigem A5-PDF."],
    ["Fino a 120 pagine · progetto editoriale su misura con 10 copie cartacee comprese.", "Bis zu 120 Seiten · maßgeschneidertes redaktionelles Projekt einschließlich 10 gedruckter Exemplare."]
  ] : [
    ["Fino a 100 pagine · 12 capitoli · percorso digitale guidato dalle Muse e PDF A5 pronto per la stampa.", "Up to 100 pages · 12 chapters · a digital path guided by the Muses and an A5 PDF ready for printing."],
    ["Fino a 120 pagine · 18 capitoli · percorso approfondito con revisione editoriale e PDF A5 pronto per la stampa.", "Up to 120 pages · 18 chapters · an in-depth path with editorial review and an A5 PDF ready for printing."],
    ["Fino a 120 pagine · progetto editoriale su misura con 10 copie cartacee comprese.", "Up to 120 pages · a tailored editorial project with 10 printed copies included."]
  ];
  let out = html;
  for (const [source, target] of pairs) {
    out = out.split(`<p class="small">${source}</p>`).join(`<p class="small">${target}</p>`);
  }
  return out;
}

function localizeCommercialHtml(html, locale) {
  let out = String(html || "");
  const pairs = locale === "de" ? [
    ['<p class="eyebrow">Completa il libro</p>', '<p class="eyebrow">Buch vervollständigen</p>'],
    ['<h3>Scegli la formula per continuare</h3>', '<h3>Wähle das passende Programm, um fortzufahren</h3>'],
    ['<h3>La formula è stata scelta</h3>', '<h3>Das Programm wurde ausgewählt</h3>'],
    ['<h3>Dati per il bonifico</h3>', '<h3>Bankdaten</h3>'],
    ['<strong>Intestatario:</strong>', '<strong>Kontoinhaber:</strong>'],
    ['<strong>Banca:</strong>', '<strong>Bank:</strong>'],
    ['<button class="button">Scegli la formula da sbloccare</button>', '<button class="button">Programm zur Freischaltung auswählen</button>'],
    ['<span class="badge">Bonifico in attesa di verifica</span>', '<span class="badge">Überweisung wird geprüft</span>'],
    ['<span class="badge">Rimborsato</span>', '<span class="badge">Erstattet</span>'],
    ['Gli altri capitoli si apriranno appena Splendoria avrà verificato il bonifico.', 'Die weiteren Kapitel werden freigeschaltet, sobald Splendoria die Überweisung geprüft hat.'],
    ['Il primo capitolo resta disponibile. ', 'Das erste Kapitel bleibt verfügbar. ']
  ] : [
    ['<p class="eyebrow">Completa il libro</p>', '<p class="eyebrow">Complete the book</p>'],
    ['<h3>Scegli la formula per continuare</h3>', '<h3>Choose a programme to continue</h3>'],
    ['<h3>La formula è stata scelta</h3>', '<h3>Your programme has been selected</h3>'],
    ['<h3>Dati per il bonifico</h3>', '<h3>Bank transfer details</h3>'],
    ['<strong>Intestatario:</strong>', '<strong>Account holder:</strong>'],
    ['<strong>Banca:</strong>', '<strong>Bank:</strong>'],
    ['<button class="button">Scegli la formula da sbloccare</button>', '<button class="button">Choose the programme to unlock</button>'],
    ['<span class="badge">Bonifico in attesa di verifica</span>', '<span class="badge">Bank transfer awaiting verification</span>'],
    ['<span class="badge">Rimborsato</span>', '<span class="badge">Refunded</span>'],
    ['Gli altri capitoli si apriranno appena Splendoria avrà verificato il bonifico.', 'The remaining chapters will unlock as soon as Splendoria has verified the bank transfer.'],
    ['Il primo capitolo resta disponibile. ', 'The first chapter remains available. ']
  ];
  for (const [source, target] of pairs) out = out.split(source).join(target);

  out = replacePlanDescriptions(out, locale);

  out = out.replace(/<span>Ho letto e accetto i (<a href="\/(?:de|en)\/termini-condizioni"[^>]*>[^<]+<\/a>)\. Comprendo che l’invio costituisce una richiesta e che il progetto inizierà dopo la conferma scritta di Splendoria\.<\/span>/g,
    locale === "de"
      ? '<span>Ich habe die $1 gelesen und akzeptiere sie. Mir ist bewusst, dass das Absenden eine Anfrage darstellt und das Projekt nach der schriftlichen Bestätigung durch Splendoria beginnt.</span>'
      : '<span>I have read and accept the $1. I understand that submitting this form is a request and that the project begins after written confirmation from Splendoria.</span>');

  out = out.replace(/<p class="small muted">Causale consigliata: Splendoria · ([\s\S]*?)\. Dopo la verifica, l’amministratore imposterà lo stato “Pagato” e il libro si sbloccherà integralmente\.<\/p>/g,
    (_match, title) => locale === "de"
      ? `<p class="small muted">Empfohlener Verwendungszweck: Splendoria · ${title}. Nach der Prüfung setzt die Administration den Status auf „Bezahlt“ und das Buch wird vollständig freigeschaltet.</p>`
      : `<p class="small muted">Suggested payment reference: Splendoria · ${title}. After verification, the administrator will set the status to “Paid” and the entire book will be unlocked.</p>`);

  return out;
}

async function fetchCommercial(request, env, ctx) {
  const response = await editorWorker.fetch(request, env, ctx);
  const locale = localeFromPath(new URL(request.url).pathname);
  if (!locale || request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(localizeCommercialHtml(await response.text(), locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchCommercial,
  email(message, env, ctx) { return editorWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return editorWorker.scheduled(controller, env, ctx); }
};
