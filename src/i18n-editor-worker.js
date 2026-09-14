import sessionWorker from "./i18n-session-worker.js";

const ORIGIN = "https://www.splendoria.vip";
const LOCALES = new Set(["de", "en"]);
const LOCAL_PUBLIC = new Set([
  "/studio", "/account", "/area-clienti", "/registrati", "/password-dimenticata", "/reimposta-password",
  "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"
]);

function localizedEditorRoute(pathname) {
  const match = pathname.match(/^\/(de|en)(\/libro\/[^/]+(?:\/.*)?)$/);
  return match ? { locale: match[1], internalPath: match[2] } : null;
}

function localizedNewBookRoute(pathname) {
  const match = pathname.match(/^\/(de|en)\/nuovo-libro$/);
  return match ? match[1] : "";
}

function addLocale(locale, path) {
  if (!path || path === "/") return `/${locale}/`;
  return `/${locale}${path}`;
}

function localizeRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, ORIGIN); } catch { return response; }
  if (target.pathname.startsWith("/libro/")) target.pathname = addLocale(locale, target.pathname);
  else if (LOCAL_PUBLIC.has(target.pathname)) target.pathname = addLocale(locale, target.pathname);
  else return response;
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function preserveToneValues(html, locale) {
  const labels = locale === "de" ? {
    "Emozionante e autentico": "Emotional und authentisch",
    "Intimo e riflessivo": "Intim und nachdenklich",
    "Leggero e brillante": "Leicht und lebendig",
    "Professionale e autorevole": "Professionell und souverän"
  } : {
    "Emozionante e autentico": "Emotional and authentic",
    "Intimo e riflessivo": "Intimate and reflective",
    "Leggero e brillante": "Light and lively",
    "Professionale e autorevole": "Professional and authoritative"
  };
  let out = html;
  for (const [canonical, display] of Object.entries(labels)) {
    const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`<option( selected)?>(?:${escaped})<\\/option>`, "g"), (_m, selected = "") => `<option value="${canonical}"${selected || ""}>${display}</option>`);
  }
  return out;
}

function rewriteLocaleLinks(html, locale) {
  let out = String(html || "");
  const bookAttrs = ["href", "action", "formaction", "data-book-path"];
  for (const attr of bookAttrs) {
    out = out.replace(new RegExp(`${attr}="\\/libro\\/`, "g"), `${attr}="/${locale}/libro/`);
  }
  out = out.split('action="/nuovo-libro"').join(`action="/${locale}/nuovo-libro"`);
  for (const path of LOCAL_PUBLIC) {
    out = out.split(`href="${path}"`).join(`href="/${locale}${path}"`);
  }
  out = out.split('href="/#').join(`href="/${locale}/#`);
  out = out.replace(/class="brand" href="\/"/, `class="brand" href="/${locale}/"`);
  out = out.split('action="/esci"').join(`action="/${locale}/esci"`);
  out = out.replace(/src="\/assets\/studio\.js\?([^"#]*)"/i, (_m, query) => {
    const params = new URLSearchParams(query || "");
    params.set("lang", locale);
    return `src="/assets/studio.js?${params.toString()}"`;
  });
  return out;
}

function pairs(locale) {
  const de = [
    ['<a href="/studio">← Tutti i libri</a>', '<a href="/studio">← Alle Bücher</a>'],
    ['<p class="eyebrow">Il tuo viaggio di scrittura</p>', '<p class="eyebrow">Deine Schreibreise</p>'],
    ['<p class="muted">La tua voce guida il libro. La Musa AI ti aiuta a trovare struttura, ritmo e parole.</p>', '<p class="muted">Deine Stimme führt das Buch. Die KI-Muse hilft dir, Struktur, Rhythmus und Worte zu finden.</p>'],
    [">Sfoglia l'anteprima</a>", ">Vorschau durchblättern</a>"],
    ['>La scintilla</div>', '>Der Funke</div>'],
    ['>La trama</div>', '>Die Handlung</div>'],
    ['>I capitoli</div>', '>Die Kapitel</div>'],
    ['>Il libro</div>', '>Das Buch</div>'],
    ['<p class="eyebrow">L\'anima del libro</p>', '<p class="eyebrow">Die Seele des Buches</p>'],
    ['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Vor den Worten stehen die Erinnerungen.</h2>'],
    ['<label class="field">Titolo<input', '<label class="field">Titel<input'],
    ['<label class="field">Tono<select', '<label class="field">Ton<select'],
    ['<label class="field">Per chi è scritto?<input', '<label class="field">Für wen ist es geschrieben?<input'],
    ['<label class="field">Struttura del libro<select', '<label class="field">Buchstruktur<select'],
    ['12 capitoli · circa 7 pagine ciascuno', '12 Kapitel · etwa 7 Seiten je Kapitel'],
    ['18 capitoli · circa 6–7 pagine ciascuno', '18 Kapitel · etwa 6–7 Seiten je Kapitel'],
    ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIB MIR WEITERE DATEN UND FAKTEN</p>'],
    ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>Je mehr Wirklichkeit du mir anvertraust, desto mehr bleibt die Geschichte deine.</h3>'],
    ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Zusätzliche Daten und Fakten</span>'],
    ['Aggiungi dati a voce', 'Daten per Spracheingabe hinzufügen'],
    ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Erzähle deine Geschichte frei<textarea'],
    ['Racconta a voce', 'Per Sprache erzählen'],
    ['<label class="field">I protagonisti<textarea', '<label class="field">Die Hauptpersonen<textarea'],
    ['<label class="field">I momenti decisivi<textarea', '<label class="field">Die entscheidenden Momente<textarea'],
    ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">Was du hinterlassen möchtest<textarea'],
    ['>Approfondisci</a>.', '>Mehr erfahren</a>.'],
    ['<button class="button">Custodisci questi ricordi</button>', '<button class="button">Diese Erinnerungen sichern</button>'],
    ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narratives Interview</p>'],
    ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>Die Muse wird zu deiner persönlichen Interviewerin</h3>'],
    ['<button class="button">Affida queste risposte alla Musa</button>', '<button class="button">Diese Antworten der Muse anvertrauen</button>'],
    ['<button class="button">Disegna la trama del mio libro</button>', '<button class="button">Die Struktur meines Buches entwerfen</button>'],
    ['<p class="eyebrow">Il prossimo incanto</p>', '<p class="eyebrow">Der nächste Schritt</p>'],
    ['<h3>La tua storia sta per trovare una forma.</h3>', '<h3>Deine Geschichte beginnt, Form anzunehmen.</h3>'],
    ['<p>Salva i ricordi, chiedi alla Musa le domande giuste e lascia che Splendoria disegni l\'indice.</p>', '<p>Sichere deine Erinnerungen, lass dir von der Muse die richtigen Fragen stellen und Splendoria das Inhaltsverzeichnis entwerfen.</p>'],
    ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Deine Muse</p>'],
    ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digitale Begleitung, menschliches Feingefühl</p>'],
    ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Erzähle mit deiner eigenen Stimme.</h3>'],
    ['<strong>Trasparenza IA</strong>', '<strong>KI-Transparenz</strong>'],
    ['>Come funziona</a>.', '>So funktioniert es</a>.'],
    ['<label for="voice-language-', '<label for="voice-language-'],
    ['>Lingua della dettatura</label>', '>Sprache der Diktierfunktion</label>'],
    ['<option value="it-IT">Italiano</option>', '<option value="it-IT">Italienisch</option>'],
    ['<p class="muse-human small"><strong>Supervisione umana</strong>', '<p class="muse-human small"><strong>Menschliche Kontrolle</strong>'],
    ['<p class="eyebrow">Avanzamento del libro</p>', '<p class="eyebrow">Fortschritt des Buches</p>'],
    ['<span>del libro</span>', '<span>des Buches</span>'],
    ['>↶ Ripristina ultima versione libro</button>', '>↶ Letzte Buchversion wiederherstellen</button>'],
    ['<summary class="button danger">Elimina libro</summary>', '<summary class="button danger">Buch löschen</summary>'],
    ['<h3>Eliminazione definitiva</h3>', '<h3>Dauerhafte Löschung</h3>'],
    ['Scrivi ELIMINA per confermare', 'Tippe ELIMINA zur Bestätigung'],
    ['Elimina definitivamente questo libro', 'Dieses Buch endgültig löschen'],
    ['<span class="eyebrow">Percorso guidato</span>', '<span class="eyebrow">Geführter Weg</span>'],
    ['Apri la guida completa', 'Vollständigen Leitfaden öffnen'],
    ['<a href="/guida">Apri la guida completa</a> se vuoi vedere istruzioni, esempi e soluzioni ai problemi più comuni.', '<a href="/guida">Vollständigen Leitfaden öffnen</a>, um Anleitungen, Beispiele und Lösungen für häufige Probleme zu sehen.'],
    ['<a href="/studio">', '<a href="/studio">'],
    ['← Torna indietro', '← Zurück'],
    ['Apri stampa / Salva PDF', 'Drucken öffnen / PDF speichern'],
    ['Edizione personale', 'Persönliche Ausgabe'],
    ['<p class="book-overline">Sommario</p>', '<p class="book-overline">Inhalt</p>'],
    ['<h2>Indice</h2>', '<h2>Inhaltsverzeichnis</h2>'],
    ['Nessun capitolo disponibile', 'Keine Kapitel verfügbar'],
    ['Capitolo ancora da generare.', 'Kapitel noch nicht erstellt.'],
    ['Come funziona', 'So funktioniert es'],
    ['Listino', 'Preise'],
    ['Contattaci', 'Kontakt'],
    ['Guida allo Studio', 'Studio-Leitfaden'],
    ['Termini e condizioni', 'Allgemeine Geschäftsbedingungen'],
    ['Note legali', 'Rechtliche Hinweise'],
    ['Trasparenza IA', 'KI-Transparenz'],
    ['Cookie e dati locali', 'Cookies und lokale Daten'],
    ['Ho capito', 'Verstanden']
  ];
  const en = [
    ['<a href="/studio">← Tutti i libri</a>', '<a href="/studio">← All books</a>'],
    ['<p class="eyebrow">Il tuo viaggio di scrittura</p>', '<p class="eyebrow">Your writing journey</p>'],
    ['<p class="muted">La tua voce guida il libro. La Musa AI ti aiuta a trovare struttura, ritmo e parole.</p>', '<p class="muted">Your voice leads the book. The AI Muse helps you find structure, rhythm and words.</p>'],
    [">Sfoglia l'anteprima</a>", ">Browse preview</a>"],
    ['>La scintilla</div>', '>The spark</div>'],
    ['>La trama</div>', '>The story</div>'],
    ['>I capitoli</div>', '>The chapters</div>'],
    ['>Il libro</div>', '>The book</div>'],
    ['<p class="eyebrow">L\'anima del libro</p>', '<p class="eyebrow">The soul of the book</p>'],
    ['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Before the words come the memories.</h2>'],
    ['<label class="field">Titolo<input', '<label class="field">Title<input'],
    ['<label class="field">Tono<select', '<label class="field">Tone<select'],
    ['<label class="field">Per chi è scritto?<input', '<label class="field">Who is it written for?<input'],
    ['<label class="field">Struttura del libro<select', '<label class="field">Book structure<select'],
    ['12 capitoli · circa 7 pagine ciascuno', '12 chapters · about 7 pages each'],
    ['18 capitoli · circa 6–7 pagine ciascuno', '18 chapters · about 6–7 pages each'],
    ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIVE ME MORE DATA AND FACTS</p>'],
    ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>The more reality you entrust to me, the more the story remains yours.</h3>'],
    ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Additional data and facts</span>'],
    ['Aggiungi dati a voce', 'Add facts by voice'],
    ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Tell the story freely<textarea'],
    ['Racconta a voce', 'Tell it by voice'],
    ['<label class="field">I protagonisti<textarea', '<label class="field">The main people<textarea'],
    ['<label class="field">I momenti decisivi<textarea', '<label class="field">The turning points<textarea'],
    ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">What you want to leave behind<textarea'],
    ['>Approfondisci</a>.', '>Learn more</a>.'],
    ['<button class="button">Custodisci questi ricordi</button>', '<button class="button">Safeguard these memories</button>'],
    ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narrative interview</p>'],
    ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>The Muse becomes your personal interviewer</h3>'],
    ['<button class="button">Affida queste risposte alla Musa</button>', '<button class="button">Entrust these answers to the Muse</button>'],
    ['<button class="button">Disegna la trama del mio libro</button>', '<button class="button">Design my book structure</button>'],
    ['<p class="eyebrow">Il prossimo incanto</p>', '<p class="eyebrow">The next step</p>'],
    ['<h3>La tua storia sta per trovare una forma.</h3>', '<h3>Your story is about to take shape.</h3>'],
    ['<p>Salva i ricordi, chiedi alla Musa le domande giuste e lascia che Splendoria disegni l\'indice.</p>', '<p>Save your memories, ask the Muse the right questions and let Splendoria design the table of contents.</p>'],
    ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Your Muse</p>'],
    ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digital guidance, human sensitivity</p>'],
    ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Tell it in your own voice.</h3>'],
    ['<strong>Trasparenza IA</strong>', '<strong>AI transparency</strong>'],
    ['>Come funziona</a>.', '>How it works</a>.'],
    ['>Lingua della dettatura</label>', '>Dictation language</label>'],
    ['<p class="muse-human small"><strong>Supervisione umana</strong>', '<p class="muse-human small"><strong>Human review</strong>'],
    ['<p class="eyebrow">Avanzamento del libro</p>', '<p class="eyebrow">Book progress</p>'],
    ['<span>del libro</span>', '<span>of the book</span>'],
    ['>↶ Ripristina ultima versione libro</button>', '>↶ Restore latest book version</button>'],
    ['<summary class="button danger">Elimina libro</summary>', '<summary class="button danger">Delete book</summary>'],
    ['<h3>Eliminazione definitiva</h3>', '<h3>Permanent deletion</h3>'],
    ['Scrivi ELIMINA per confermare', 'Type ELIMINA to confirm'],
    ['Elimina definitivamente questo libro', 'Permanently delete this book'],
    ['<span class="eyebrow">Percorso guidato</span>', '<span class="eyebrow">Guided path</span>'],
    ['Apri la guida completa', 'Open the full guide'],
    ['<a href="/guida">Apri la guida completa</a> se vuoi vedere istruzioni, esempi e soluzioni ai problemi più comuni.', '<a href="/guida">Open the full guide</a> for instructions, examples and solutions to common problems.'],
    ['← Torna indietro', '← Back'],
    ['Apri stampa / Salva PDF', 'Open print / Save PDF'],
    ['Edizione personale', 'Personal edition'],
    ['<p class="book-overline">Sommario</p>', '<p class="book-overline">Contents</p>'],
    ['<h2>Indice</h2>', '<h2>Table of contents</h2>'],
    ['Nessun capitolo disponibile', 'No chapters available'],
    ['Capitolo ancora da generare.', 'Chapter not generated yet.'],
    ['Come funziona', 'How it works'],
    ['Listino', 'Pricing'],
    ['Contattaci', 'Contact'],
    ['Guida allo Studio', 'Studio Guide'],
    ['Termini e condizioni', 'Terms and conditions'],
    ['Note legali', 'Legal notice'],
    ['Trasparenza IA', 'AI transparency'],
    ['Cookie e dati locali', 'Cookie and local data'],
    ['Ho capito', 'Got it']
  ];
  return locale === "de" ? de : en;
}

function localizeEditorHtml(html, locale) {
  let out = String(html || "").replace('<html lang="it">', `<html lang="${locale}">`);
  out = preserveToneValues(out, locale);
  for (const [source, target] of pairs(locale)) out = out.split(source).join(target);
  out = out.replace(/<p class="book-chapter-number">Capitolo (\d+)<\/p>/g, (_m, n) => `<p class="book-chapter-number">${locale === "de" ? "Kapitel" : "Chapter"} ${n}</p>`);
  out = out.replace(/<p class="book-author">di ([\s\S]*?)<\/p>/g, (_m, name) => `<p class="book-author">${locale === "de" ? "von" : "by"} ${name}</p>`);
  out = rewriteLocaleLinks(out, locale);
  return out;
}

function localizeEditorScript(source, locale) {
  let out = String(source || "");
  out = out
    .split("window.location.pathname.match(/^\\/libro\\/([^/]+)/)").join("window.location.pathname.match(/^\\/(?:(?:de|en)\\/)?libro\\/([^/]+)/)")
    .split("/^\\/libro\\/[^/]+$/.test(window.location.pathname)").join("/^\\/(?:(?:de|en)\\/)?libro\\/[^/]+$/.test(window.location.pathname)")
    .split("_splStudioPath.match(/^\\/libro\\/([^/]+)").join("_splStudioPath.match(/^\\/(?:(?:de|en)\\/)?libro\\/([^/]+)")
    .split("const SPL_CLIENT_DRAFT_KEY = SPL_CLIENT_DRAFT_PREFIX + window.location.pathname;").join("const SPL_CLIENT_DRAFT_KEY = SPL_CLIENT_DRAFT_PREFIX + window.location.pathname.replace(/^\\/(?:de|en)(?=\\/libro\\/)/, '');")
    .split("let formPath = window.location.pathname;").join("let formPath = window.location.pathname.replace(/^\\/(?:de|en)(?=\\/libro\\/)/, '');")
    .split("formPath = new URL(form.action, window.location.href).pathname;").join("formPath = new URL(form.action, window.location.href).pathname.replace(/^\\/(?:de|en)(?=\\/libro\\/)/, '');")
    .split("const parts = new URL(value || '', window.location.href).pathname.split('/').filter(Boolean);\n        if (parts[0] !== 'libro'").join("const parts = new URL(value || '', window.location.href).pathname.split('/').filter(Boolean);\n        if (parts[0] === 'de' || parts[0] === 'en') parts.shift();\n        if (parts[0] !== 'libro'");
  const runtimePairs = locale === "de" ? [
    ["Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.", "Die letzte gespeicherte Buchversion wiederherstellen? Der aktuelle Stand wird als vorherige Version gesichert, sodass du zurückkehren kannst."],
    ["Metto al sicuro le tue parole…", "Ich sichere deine Worte…"]
  ] : [
    ["Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.", "Restore the latest saved version of the book? The current state will be kept as the previous version, so you can go back."],
    ["Metto al sicuro le tue parole…", "Safeguarding your words…"]
  ];
  for (const [sourceText, target] of runtimePairs) out = out.split(sourceText).join(target);
  return out;
}

function privateHeaders(response, locale) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", locale);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return headers;
}

async function fetchEditor(request, env, ctx) {
  const url = new URL(request.url);
  const editorRoute = localizedEditorRoute(url.pathname);
  const newBookLocale = localizedNewBookRoute(url.pathname);

  if (newBookLocale) {
    const internalUrl = new URL(request.url);
    internalUrl.pathname = "/nuovo-libro";
    const response = await sessionWorker.fetch(new Request(internalUrl.toString(), request), env, ctx);
    return localizeRedirect(response, newBookLocale);
  }

  if (editorRoute) {
    const internalUrl = new URL(request.url);
    internalUrl.pathname = editorRoute.internalPath;
    let response = await sessionWorker.fetch(new Request(internalUrl.toString(), request), env, ctx);
    response = localizeRedirect(response, editorRoute.locale);
    if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
    return new Response(localizeEditorHtml(await response.text(), editorRoute.locale), {
      status: response.status,
      statusText: response.statusText,
      headers: privateHeaders(response, editorRoute.locale)
    });
  }

  let response = await sessionWorker.fetch(request, env, ctx);
  const locale = url.searchParams.get("lang");
  if (request.method === "GET" && url.pathname === "/assets/studio.js" && LOCALES.has(locale) && response.ok && (response.headers.get("content-type") || "").includes("javascript")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeEditorScript(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
  }
  if (request.method === "GET" && response.ok && (response.headers.get("content-type") || "").includes("text/html")) {
    const match = url.pathname.match(/^\/(de|en)\/studio$/);
    if (match) {
      const headers = privateHeaders(response, match[1]);
      const html = String(await response.text()).split('action="/nuovo-libro"').join(`action="/${match[1]}/nuovo-libro"`);
      return new Response(html, { status: response.status, statusText: response.statusText, headers });
    }
  }
  return response;
}

export default {
  fetch: fetchEditor,
  email(message, env, ctx) { return sessionWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return sessionWorker.scheduled(controller, env, ctx); }
};
