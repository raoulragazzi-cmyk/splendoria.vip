import sessionWorker from "./i18n-session-worker.js";

const ORIGIN = "https://www.splendoria.vip";
const LOCALES = new Set(["de", "en"]);
const LOCAL_PATHS = new Set([
  "/studio", "/account", "/area-clienti", "/registrati", "/password-dimenticata", "/reimposta-password",
  "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"
]);

function editorRoute(pathname) {
  const match = pathname.match(/^\/(de|en)(\/libro\/[^/]+(?:\/.*)?)$/);
  return match ? { locale: match[1], internalPath: match[2] } : null;
}

function newBookLocale(pathname) {
  return pathname.match(/^\/(de|en)\/nuovo-libro$/)?.[1] || "";
}

function localizedPath(locale, pathname) {
  return pathname === "/" ? `/${locale}/` : `/${locale}${pathname}`;
}

function localizeRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, ORIGIN); } catch { return response; }
  if (target.pathname.startsWith("/libro/") || LOCAL_PATHS.has(target.pathname)) target.pathname = localizedPath(locale, target.pathname);
  else return response;
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function privateHeaders(response, locale) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", locale);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return headers;
}

function localizeRoutes(html, locale) {
  let out = String(html || "");
  for (const attr of ["href", "action", "formaction", "data-book-path"]) {
    out = out.replace(new RegExp(`${attr}="\\/libro\\/`, "g"), `${attr}="/${locale}/libro/`);
  }
  out = out.split('action="/nuovo-libro"').join(`action="/${locale}/nuovo-libro"`);
  out = out.split('action="/esci"').join(`action="/${locale}/esci"`);
  for (const path of LOCAL_PATHS) out = out.split(`href="${path}"`).join(`href="/${locale}${path}"`);
  out = out.split('href="/#').join(`href="/${locale}/#`);
  out = out.replace(/class="brand" href="\/"/, `class="brand" href="/${locale}/"`);
  out = out.replace(/src="\/assets\/studio\.js\?([^"#]*)"/i, (_m, query) => {
    const params = new URLSearchParams(query || "");
    params.set("lang", locale);
    return `src="/assets/studio.js?${params.toString()}"`;
  });
  return out;
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

function exactPairs(locale) {
  if (locale === "de") return [
    ['<a href="/#metodo">Come funziona</a>', '<a href="/#metodo">So funktioniert es</a>'],
    ['<a href="/#formule">Listino</a>', '<a href="/#formule">Preise</a>'],
    ['<a href="/guida">Guida</a>', '<a href="/guida">Leitfaden</a>'],
    ['<a href="/#contatti">Contattaci</a>', '<a href="/#contatti">Kontakt</a>'],
    ['>Il mio Studio</a>', '>Mein Studio</a>'],
    ['<a href="/account">Account</a>', '<a href="/account">Konto</a>'],
    ['>Esci</button>', '>Abmelden</button>'],
    ['<p class="small">La tua vita in un romanzo</p>', '<p class="small">Dein Leben als Roman</p>'],
    ['>Guida allo Studio</a>', '>Studio-Leitfaden</a>'],
    ['>Termini e condizioni</a>', '>Allgemeine Geschäftsbedingungen</a>'],
    ['>Note legali</a>', '>Rechtliche Hinweise</a>'],
    ['>Trasparenza IA</a>', '>KI-Transparenz</a>'],
    ['<a href="/studio">← Tutti i libri</a>', '<a href="/studio">← Alle Bücher</a>'],
    ['<p class="eyebrow">Il tuo viaggio di scrittura</p>', '<p class="eyebrow">Deine Schreibreise</p>'],
    ['<p class="muted">La tua voce guida il libro. La Musa AI ti aiuta a trovare struttura, ritmo e parole.</p>', '<p class="muted">Deine Stimme führt das Buch. Die KI-Muse hilft dir, Struktur, Rhythmus und Worte zu finden.</p>'],
    [">Sfoglia l'anteprima</a>", ">Vorschau durchblättern</a>"],
    ['>La scintilla</div>', '>Der Funke</div>'], ['>La trama</div>', '>Die Handlung</div>'], ['>I capitoli</div>', '>Die Kapitel</div>'], ['>Il libro</div>', '>Das Buch</div>'],
    ['<p class="eyebrow">Avanzamento del libro</p>', '<p class="eyebrow">Fortschritt des Buches</p>'],
    ['<span>del libro</span>', '<span>des Buches</span>'],
    ['<p class="eyebrow">L\'anima del libro</p>', '<p class="eyebrow">Die Seele des Buches</p>'],
    ['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Vor den Worten stehen die Erinnerungen.</h2>'],
    ['<summary>Impostazioni del libro</summary>', '<summary>Bucheinstellungen</summary>'],
    ['<label class="field">Titolo<input', '<label class="field">Titel<input'],
    ['<label class="field">Tono<select', '<label class="field">Ton<select'],
    ['<label class="field">Per chi è scritto?<input', '<label class="field">Für wen ist es geschrieben?<input'],
    ['<label class="field">Struttura del libro<select', '<label class="field">Buchstruktur<select'],
    ['12 capitoli · circa 7 pagine ciascuno', '12 Kapitel · etwa 7 Seiten je Kapitel'],
    ['18 capitoli · circa 6–7 pagine ciascuno', '18 Kapitel · etwa 6–7 Seiten je Kapitel'],
    ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIB MIR WEITERE DATEN UND FAKTEN</p>'],
    ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>Je mehr Wirklichkeit du mir anvertraust, desto mehr bleibt die Geschichte deine.</h3>'],
    ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Zusätzliche Daten und Fakten</span>'],
    ['placeholder="Per esempio: nel 1987 ci trasferimmo a Milano; mia madre Anna lavorava…"', 'placeholder="Zum Beispiel: 1987 zogen wir nach Mailand; meine Mutter Anna arbeitete…"'],
    ['● Aggiungi dati a voce', '● Daten per Spracheingabe hinzufügen'],
    ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Erzähle deine Geschichte frei<textarea'],
    ['placeholder="Scrivi come parleresti a una persona cara. Non preoccuparti dello stile: a quello penseremo insieme."', 'placeholder="Schreibe so, wie du einer vertrauten Person erzählen würdest. Um den Stil kümmern wir uns gemeinsam."'],
    ['● Racconta a voce', '● Per Sprache erzählen'],
    ['<label class="field">I protagonisti<textarea', '<label class="field">Die Hauptpersonen<textarea'],
    ['<label class="field">I momenti decisivi<textarea', '<label class="field">Die entscheidenden Momente<textarea'],
    ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">Was du hinterlassen möchtest<textarea'],
    ['<button class="button">Custodisci questi ricordi</button>', '<button class="button">Diese Erinnerungen sichern</button>'],
    ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narratives Interview</p>'],
    ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>Die Muse wird zu deiner persönlichen Interviewerin</h3>'],
    ['<button class="button">Affida queste risposte alla Musa</button>', '<button class="button">Diese Antworten der Muse anvertrauen</button>'],
    ['<button class="button">Disegna la trama del mio libro</button>', '<button class="button">Die Struktur meines Buches entwerfen</button>'],
    ['<p class="eyebrow">Il prossimo incanto</p>', '<p class="eyebrow">Der nächste Schritt</p>'],
    ['<h3>La tua storia sta per trovare una forma.</h3>', '<h3>Deine Geschichte beginnt, Form anzunehmen.</h3>'],
    ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Deine Muse</p>'],
    ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digitale Begleitung, menschliches Feingefühl</p>'],
    ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Erzähle mit deiner eigenen Stimme.</h3>'],
    ['<strong>Trasparenza IA</strong>', '<strong>KI-Transparenz</strong>'],
    ['>Lingua della dettatura</label>', '>Sprache der Diktierfunktion</label>'],
    ['<option value="it-IT">Italiano</option>', '<option value="it-IT">Italienisch</option>'],
    ['<p class="muse-human small"><strong>Supervisione umana</strong>', '<p class="muse-human small"><strong>Menschliche Kontrolle</strong>'],
    ['>↶ Ripristina ultima versione libro</button>', '>↶ Letzte Buchversion wiederherstellen</button>'],
    ['<summary class="button danger">Elimina libro</summary>', '<summary class="button danger">Buch löschen</summary>'],
    ['<h3>Eliminazione definitiva</h3>', '<h3>Dauerhafte Löschung</h3>'],
    ['<button class="button danger">Elimina definitivamente questo libro</button>', '<button class="button danger">Dieses Buch endgültig löschen</button>'],
    ['<span class="eyebrow">Percorso guidato</span>', '<span class="eyebrow">Geführter Weg</span>'],
    ['<a href="/guida">Apri la guida completa</a>', '<a href="/guida">Vollständigen Leitfaden öffnen</a>'],
    ['<label class="field chapter-title-field">Titolo del capitolo ', '<label class="field chapter-title-field">Kapiteltitel '],
    ['· puoi rinominarlo in qualsiasi momento', '· jederzeit umbenennbar'],
    ['<label class="field chapter-writing-field">La tua pagina<textarea', '<label class="field chapter-writing-field">Deine Seite<textarea'],
    ['● Detta il capitolo', '● Kapitel diktieren'],
    ['>✦ Migliora</button>', '>✦ Verbessern</button>'],
    ['>Affidati alla Musa</button>', '>Der Muse anvertrauen</button>'],
    ['<button class="button">Salva le mie modifiche</button>', '<button class="button">Meine Änderungen speichern</button>'],
    ['>Crea una nuova versione</button>', '>Neue Version erstellen</button>'],
    ['>Scrivi questo capitolo con me</button>', '>Dieses Kapitel mit mir schreiben</button>'],
    ['<h4 id="live-preview-title-', '<h4 id="live-preview-title-'],
    ['>ANTEPRIMA</h4>', '>VORSCHAU</h4>'],
    ['>Apri l’anteprima completa ↗</a>', '>Vollständige Vorschau öffnen ↗</a>'],
    ['<b>Revisore Musa AI</b> · lavora sul testo visibile e conserva la tua voce:', '<b>KI-Muse als Lektorin</b> · arbeitet am sichtbaren Text und bewahrt deine Stimme:'],
    ['>✓ Correggi grammatica</button>', '>✓ Grammatik korrigieren</button>'],
    ['>◇ Più chiaro e scorrevole</button>', '>◇ Klarer und flüssiger</button>'],
    ['>✦ Più emozionante</button>', '>✦ Emotionaler</button>'],
    ['>◉ Più vivido</button>', '>◉ Anschaulicher</button>'],
    ['>✎ Più elegante</button>', '>✎ Eleganter</button>'],
    ['>↘ Più essenziale</button>', '>↘ Prägnanter</button>'],
    ['← Torna indietro', '← Zurück'],
    ['>Apri stampa / Salva PDF</button>', '>Drucken öffnen / PDF speichern</button>'],
    ['<p class="book-edition">Edizione personale</p>', '<p class="book-edition">Persönliche Ausgabe</p>'],
    ['<p class="book-overline">Sommario</p>', '<p class="book-overline">Inhalt</p>'],
    ['<h2>Indice</h2>', '<h2>Inhaltsverzeichnis</h2>'],
    ['<li>Nessun capitolo disponibile</li>', '<li>Keine Kapitel verfügbar</li>']
  ];
  return [
    ['<a href="/#metodo">Come funziona</a>', '<a href="/#metodo">How it works</a>'],
    ['<a href="/#formule">Listino</a>', '<a href="/#formule">Pricing</a>'],
    ['<a href="/guida">Guida</a>', '<a href="/guida">Guide</a>'],
    ['<a href="/#contatti">Contattaci</a>', '<a href="/#contatti">Contact</a>'],
    ['>Il mio Studio</a>', '>My Studio</a>'],
    ['<a href="/account">Account</a>', '<a href="/account">Account</a>'],
    ['>Esci</button>', '>Sign out</button>'],
    ['<p class="small">La tua vita in un romanzo</p>', '<p class="small">Your life as a novel</p>'],
    ['>Guida allo Studio</a>', '>Studio Guide</a>'],
    ['>Termini e condizioni</a>', '>Terms and conditions</a>'],
    ['>Note legali</a>', '>Legal notice</a>'],
    ['>Trasparenza IA</a>', '>AI transparency</a>'],
    ['<a href="/studio">← Tutti i libri</a>', '<a href="/studio">← All books</a>'],
    ['<p class="eyebrow">Il tuo viaggio di scrittura</p>', '<p class="eyebrow">Your writing journey</p>'],
    ['<p class="muted">La tua voce guida il libro. La Musa AI ti aiuta a trovare struttura, ritmo e parole.</p>', '<p class="muted">Your voice leads the book. The AI Muse helps you find structure, rhythm and words.</p>'],
    [">Sfoglia l'anteprima</a>", ">Browse preview</a>"],
    ['>La scintilla</div>', '>The spark</div>'], ['>La trama</div>', '>The story</div>'], ['>I capitoli</div>', '>The chapters</div>'], ['>Il libro</div>', '>The book</div>'],
    ['<p class="eyebrow">Avanzamento del libro</p>', '<p class="eyebrow">Book progress</p>'],
    ['<span>del libro</span>', '<span>of the book</span>'],
    ['<p class="eyebrow">L\'anima del libro</p>', '<p class="eyebrow">The soul of the book</p>'],
    ['<h2>Prima delle parole, ci sono i ricordi.</h2>', '<h2>Before the words come the memories.</h2>'],
    ['<summary>Impostazioni del libro</summary>', '<summary>Book settings</summary>'],
    ['<label class="field">Titolo<input', '<label class="field">Title<input'],
    ['<label class="field">Tono<select', '<label class="field">Tone<select'],
    ['<label class="field">Per chi è scritto?<input', '<label class="field">Who is it written for?<input'],
    ['<label class="field">Struttura del libro<select', '<label class="field">Book structure<select'],
    ['12 capitoli · circa 7 pagine ciascuno', '12 chapters · about 7 pages each'],
    ['18 capitoli · circa 6–7 pagine ciascuno', '18 chapters · about 6–7 pages each'],
    ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIVE ME MORE DATA AND FACTS</p>'],
    ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>The more reality you entrust to me, the more the story remains yours.</h3>'],
    ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Additional data and facts</span>'],
    ['placeholder="Per esempio: nel 1987 ci trasferimmo a Milano; mia madre Anna lavorava…"', 'placeholder="For example: in 1987 we moved to Milan; my mother Anna worked…"'],
    ['● Aggiungi dati a voce', '● Add facts by voice'],
    ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Tell the story freely<textarea'],
    ['placeholder="Scrivi come parleresti a una persona cara. Non preoccuparti dello stile: a quello penseremo insieme."', 'placeholder="Write as you would speak to someone close to you. Do not worry about style: we will work on that together."'],
    ['● Racconta a voce', '● Tell it by voice'],
    ['<label class="field">I protagonisti<textarea', '<label class="field">The main people<textarea'],
    ['<label class="field">I momenti decisivi<textarea', '<label class="field">The turning points<textarea'],
    ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">What you want to leave behind<textarea'],
    ['<button class="button">Custodisci questi ricordi</button>', '<button class="button">Safeguard these memories</button>'],
    ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narrative interview</p>'],
    ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>The Muse becomes your personal interviewer</h3>'],
    ['<button class="button">Affida queste risposte alla Musa</button>', '<button class="button">Entrust these answers to the Muse</button>'],
    ['<button class="button">Disegna la trama del mio libro</button>', '<button class="button">Design my book structure</button>'],
    ['<p class="eyebrow">Il prossimo incanto</p>', '<p class="eyebrow">The next step</p>'],
    ['<h3>La tua storia sta per trovare una forma.</h3>', '<h3>Your story is about to take shape.</h3>'],
    ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Your Muse</p>'],
    ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digital guidance, human sensitivity</p>'],
    ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Tell it in your own voice.</h3>'],
    ['<strong>Trasparenza IA</strong>', '<strong>AI transparency</strong>'],
    ['>Lingua della dettatura</label>', '>Dictation language</label>'],
    ['>↶ Ripristina ultima versione libro</button>', '>↶ Restore latest book version</button>'],
    ['<summary class="button danger">Elimina libro</summary>', '<summary class="button danger">Delete book</summary>'],
    ['<h3>Eliminazione definitiva</h3>', '<h3>Permanent deletion</h3>'],
    ['<button class="button danger">Elimina definitivamente questo libro</button>', '<button class="button danger">Permanently delete this book</button>'],
    ['<span class="eyebrow">Percorso guidato</span>', '<span class="eyebrow">Guided path</span>'],
    ['<a href="/guida">Apri la guida completa</a>', '<a href="/guida">Open the full guide</a>'],
    ['<label class="field chapter-title-field">Titolo del capitolo ', '<label class="field chapter-title-field">Chapter title '],
    ['· puoi rinominarlo in qualsiasi momento', '· you can rename it at any time'],
    ['<label class="field chapter-writing-field">La tua pagina<textarea', '<label class="field chapter-writing-field">Your page<textarea'],
    ['● Detta il capitolo', '● Dictate the chapter'],
    ['>✦ Migliora</button>', '>✦ Improve</button>'],
    ['>Affidati alla Musa</button>', '>Entrust to the Muse</button>'],
    ['<button class="button">Salva le mie modifiche</button>', '<button class="button">Save my changes</button>'],
    ['>Crea una nuova versione</button>', '>Create a new version</button>'],
    ['>Scrivi questo capitolo con me</button>', '>Write this chapter with me</button>'],
    ['>ANTEPRIMA</h4>', '>PREVIEW</h4>'],
    ['>Apri l’anteprima completa ↗</a>', '>Open full preview ↗</a>'],
    ['<b>Revisore Musa AI</b> · lavora sul testo visibile e conserva la tua voce:', '<b>AI Muse reviewer</b> · works on the visible text and preserves your voice:'],
    ['>✓ Correggi grammatica</button>', '>✓ Correct grammar</button>'],
    ['>◇ Più chiaro e scorrevole</button>', '>◇ Clearer and smoother</button>'],
    ['>✦ Più emozionante</button>', '>✦ More emotional</button>'],
    ['>◉ Più vivido</button>', '>◉ More vivid</button>'],
    ['>✎ Più elegante</button>', '>✎ More elegant</button>'],
    ['>↘ Più essenziale</button>', '>↘ More concise</button>'],
    ['← Torna indietro', '← Back'],
    ['>Apri stampa / Salva PDF</button>', '>Open print / Save PDF</button>'],
    ['<p class="book-edition">Edizione personale</p>', '<p class="book-edition">Personal edition</p>'],
    ['<p class="book-overline">Sommario</p>', '<p class="book-overline">Contents</p>'],
    ['<h2>Indice</h2>', '<h2>Table of contents</h2>'],
    ['<li>Nessun capitolo disponibile</li>', '<li>No chapters available</li>']
  ];
}

function localizeDynamicUi(html, locale) {
  const chapter = locale === "de" ? "Kapitel" : "Chapter";
  const question = locale === "de" ? "Frage" : "Question";
  const page = locale === "de" ? "Seite" : "Page";
  const of = locale === "de" ? "von" : "of";
  let out = html;
  out = out.replace(/<p class="kicker">Capitolo (\d+)<\/p>/g, `<p class="kicker">${chapter} $1</p>`);
  out = out.replace(/<p class="book-chapter-number">Capitolo (\d+)<\/p>/g, `<p class="book-chapter-number">${chapter} $1</p>`);
  out = out.replace(/<p class="interview-number">Domanda (\d+) di (\d+)<\/p>/g, `<p class="interview-number">${question} $1 ${of} $2</p>`);
  out = out.replace(/(<span data-live-page-status[^>]*>)Pagina (\d+) di (\d+)(<\/span>)/g, `$1${page} $2 ${of} $3$4`);
  out = out.replace(/<p class="book-author">di ([\s\S]*?)<\/p>/g, (_m, author) => `<p class="book-author">${locale === "de" ? "von" : "by"} ${author}</p>`);
  return out;
}

function localizeEditorHtml(html, locale) {
  let out = String(html || "").replace('<html lang="it">', `<html lang="${locale}">`);
  out = preserveToneValues(out, locale);
  for (const [source, target] of exactPairs(locale)) out = out.split(source).join(target);
  out = localizeDynamicUi(out, locale);
  out = localizeRoutes(out, locale);
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

async function fetchLocalizedEditor(request, env, ctx, route) {
  const internalUrl = new URL(request.url);
  internalUrl.pathname = route.internalPath;
  let response = await sessionWorker.fetch(new Request(internalUrl.toString(), request), env, ctx);
  response = localizeRedirect(response, route.locale);
  if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  return new Response(localizeEditorHtml(await response.text(), route.locale), {
    status: response.status,
    statusText: response.statusText,
    headers: privateHeaders(response, route.locale)
  });
}

async function fetchEntry(request, env, ctx) {
  const url = new URL(request.url);
  const route = editorRoute(url.pathname);
  if (route) return fetchLocalizedEditor(request, env, ctx, route);

  const creationLocale = newBookLocale(url.pathname);
  if (creationLocale) {
    const internalUrl = new URL(request.url);
    internalUrl.pathname = "/nuovo-libro";
    return localizeRedirect(await sessionWorker.fetch(new Request(internalUrl.toString(), request), env, ctx), creationLocale);
  }

  let response = await sessionWorker.fetch(request, env, ctx);
  const locale = url.searchParams.get("lang");
  if (request.method === "GET" && url.pathname === "/assets/studio.js" && LOCALES.has(locale) && response.ok && (response.headers.get("content-type") || "").includes("javascript")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeEditorScript(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
  }

  const studio = url.pathname.match(/^\/(de|en)\/studio$/);
  if (studio && request.method === "GET" && response.ok && (response.headers.get("content-type") || "").includes("text/html")) {
    const html = String(await response.text()).split('action="/nuovo-libro"').join(`action="/${studio[1]}/nuovo-libro"`);
    return new Response(html, { status: response.status, statusText: response.statusText, headers: privateHeaders(response, studio[1]) });
  }
  return response;
}

export default {
  fetch: fetchEntry,
  email(message, env, ctx) { return sessionWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return sessionWorker.scheduled(controller, env, ctx); }
};
