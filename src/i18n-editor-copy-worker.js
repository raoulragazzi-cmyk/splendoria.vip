import failsafeWorker from "./i18n-failsafe-worker.js";

const LOCALES = new Set(["de", "en"]);

function pathLocale(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

function replacePairs(value, pairs) {
  let out = String(value || "");
  for (const [source, target] of pairs) out = out.split(source).join(target);
  return out;
}

function protectAuthored(html) {
  const stash = [];
  const token = value => `__SPL_AUTHORED_${stash.push(String(value)) - 1}__`;
  let out = String(html || "");
  out = out.replace(/(<textarea\b[^>]*>)([\s\S]*?)(<\/textarea>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  out = out.replace(/(<input\b[^>]*\bvalue=")([^"]*)(")/gi, (_m, open, value, close) => `${open}${token(value)}${close}`);
  out = out.replace(/(<h[1-5]\b[^>]*>)([\s\S]*?)(<\/h[1-5]>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  out = out.replace(/(<div class="live-page-copy"[^>]*>)([\s\S]*?)(<\/div>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  return {
    html: out,
    restore(value) {
      return String(value || "").replace(/__SPL_AUTHORED_(\d+)__/g, (_m, index) => stash[Number(index)] ?? _m);
    }
  };
}

function localizeOnboarding(html, locale) {
  return String(html || "").replace(/<details class="onboarding-card"[\s\S]*?<\/details>/g, block => {
    const pairs = locale === "de" ? [
      ["Percorso guidato", "Geführter Weg"],
      ["Affida i ricordi reali", "Vertraue uns deine echten Erinnerungen an"],
      ["Completa l’intervista narrativa", "Vervollständige das narrative Interview"],
      ["Disegna l’indice del libro", "Entwirf die Gliederung des Buches"],
      ["Scrivi e controlla il primo capitolo", "Schreibe und prüfe das erste Kapitel"],
      ["Esegui la revisione finale", "Führe die abschließende Überarbeitung durch"],
      ["Genera le domande e racconta una scena alla volta", "Erzeuge die Fragen und erzähle eine Szene nach der anderen"],
      ["La Musa organizzerà i materiali senza inventare fatti", "Die Muse ordnet das Material, ohne Fakten zu erfinden"],
      ["Scrivi tu oppure affidati alla Musa", "Schreibe selbst oder vertraue dich der Muse an"],
      ["Revisione applicata: rileggi fatti e formulazioni", "Überarbeitung angewendet: Prüfe Fakten und Formulierungen noch einmal"],
      ["Usa “Correggi grammatica”, poi apri l’anteprima", "Nutze „Grammatik korrigieren“ und öffne anschließend die Vorschau"],
      ["Apri la guida completa", "Vollständigen Leitfaden öffnen"],
      ["se vuoi vedere istruzioni, esempi e soluzioni ai problemi più comuni.", "für Anleitungen, Beispiele und Lösungen zu den häufigsten Fragen."]
    ] : [
      ["Percorso guidato", "Guided path"],
      ["Affida i ricordi reali", "Entrust your real memories"],
      ["Completa l’intervista narrativa", "Complete the narrative interview"],
      ["Disegna l’indice del libro", "Shape the book outline"],
      ["Scrivi e controlla il primo capitolo", "Write and review the first chapter"],
      ["Esegui la revisione finale", "Complete the final review"],
      ["Genera le domande e racconta una scena alla volta", "Generate the questions and tell one scene at a time"],
      ["La Musa organizzerà i materiali senza inventare fatti", "The Muse organises the material without inventing facts"],
      ["Scrivi tu oppure affidati alla Musa", "Write it yourself or entrust it to the Muse"],
      ["Revisione applicata: rileggi fatti e formulazioni", "Review applied: read the facts and wording again"],
      ["Usa “Correggi grammatica”, poi apri l’anteprima", "Use “Correct grammar”, then open the preview"],
      ["Apri la guida completa", "Open the full guide"],
      ["se vuoi vedere istruzioni, esempi e soluzioni ai problemi più comuni.", "for instructions, examples and solutions to the most common issues."]
    ];
    let out = replacePairs(block, pairs);
    out = out.replace(/(\d[\d.,]*) parole raccolte · obiettivo iniziale almeno 260/g, locale === "de" ? "$1 Wörter gesammelt · erstes Ziel mindestens 260" : "$1 words collected · initial target at least 260");
    out = out.replace(/(\d[\d.,]*) parole nelle risposte/g, locale === "de" ? "$1 Wörter in den Antworten" : "$1 words in the answers");
    out = out.replace(/(\d+) capitoli creati/g, locale === "de" ? "$1 Kapitel erstellt" : "$1 chapters created");
    out = out.replace(/(\d[\d.,]*) parole nel primo capitolo/g, locale === "de" ? "$1 Wörter im ersten Kapitel" : "$1 words in the first chapter");
    out = out.replace(/(\d+) di (\d+) passi completati/g, locale === "de" ? "$1 von $2 Schritten abgeschlossen" : "$1 of $2 steps completed");
    return out;
  });
}

function localizeBackup(html, locale) {
  return String(html || "").replace(/Backup del (\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}:\d{2}:\d{2})/g,
    (_m, day, month, year, time) => locale === "de"
      ? `Sicherung vom ${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}, ${time}`
      : `Backup from ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}, ${time}`);
}

function localizeProgress(html, locale) {
  return String(html || "").replace(/<section class="book-progress-card"[\s\S]*?<\/section>/g, block => {
    let out = block;
    out = out.replace(/(\d[\d.,]*) parole · ([\d.,]+) di (\d+) pagine stimate/g, locale === "de" ? "$1 Wörter · $2 von $3 geschätzten Seiten" : "$1 words · $2 of $3 estimated pages");
    out = out.replace(/Restano circa ([\d.,]+) pagine da completare\./g, locale === "de" ? "Noch etwa $1 Seiten bis zur Fertigstellung." : "About $1 pages remain to be completed.");
    return out;
  });
}

export function localizeEditorResidualHtml(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");

  let out = localizeOnboarding(html, locale);
  out = localizeProgress(out, locale);
  out = localizeBackup(out, locale);
  const protectedHtml = protectAuthored(out);
  out = protectedHtml.html;

  const pairs = locale === "de" ? [
    ["Inserisci qui la maggiore quantità possibile di materiale concreto: date, luoghi, nomi e ruoli dei personaggi, relazioni, eventi, parole ricordate, conseguenze e ogni altro dettaglio reale. Più elementi fornisci, più la Musa potrà comporre un testo preciso, ricco e fedele alla tua voce.", "Füge hier möglichst viele konkrete Informationen ein: Daten, Orte, Namen und Rollen der Personen, Beziehungen, Ereignisse, erinnerte Worte, Folgen und jedes weitere reale Detail. Je mehr du bereitstellst, desto genauer, reicher und deiner Stimme treuer kann die Muse den Text gestalten."],
    ["placeholder=\"Chi non può mancare?\"", "placeholder=\"Wer darf keinesfalls fehlen?\""],
    ["placeholder=\"Gli incontri, le svolte, le partenze…\"", "placeholder=\"Begegnungen, Wendepunkte, Aufbrüche…\""],
    ["placeholder=\"Che cosa vorresti restasse nel cuore?\"", "placeholder=\"Was soll im Herzen bleiben?\""],
    ["placeholder=\"Racconta come se fossimo seduti davanti a un caffè…\"", "placeholder=\"Erzähle, als säßen wir gemeinsam bei einem Kaffee…\""],
    ["placeholder=\"Qui prenderà forma il capitolo…\"", "placeholder=\"Hier nimmt dein Kapitel Gestalt an…\""],
    ["<span class=\"sr-only\">La tua risposta</span>", "<span class=\"sr-only\">Deine Antwort</span>"],
    ["Premi e inizia a parlare", "Drücke und beginne zu sprechen"],
    ["● Rispondi a voce", "● Antwort einsprechen"],
    ["Le tue parole appariranno qui mentre scrivi o detti il capitolo.", "Deine Worte erscheinen hier, während du das Kapitel schreibst oder diktierst."],
    ["aria-label=\"Pagina precedente del capitolo\"", "aria-label=\"Vorherige Kapitelseite\""],
    ["aria-label=\"Pagina successiva del capitolo\"", "aria-label=\"Nächste Kapitelseite\""],
    ["La resa si aggiorna mentre scrivi o detti. L’impaginazione definitiva viene ricalcolata nel PDF completo dopo il salvataggio.", "Die Vorschau aktualisiert sich beim Schreiben oder Diktieren. Die endgültige Seitengestaltung wird nach dem Speichern im vollständigen PDF neu berechnet."],
    ["aria-label=\"Avanzamento del capitolo\"", "aria-label=\"Fortschritt des Kapitels\""],
    ["Password attuale<input", "Aktuelles Passwort<input"],
    ["La scelta vale per tutti i pulsanti del microfono e viene ricordata su questo dispositivo.", "Die Auswahl gilt für alle Mikrofontasten und wird auf diesem Gerät gespeichert."],
    ["La Musa lavora con criteri di scrittura ed editing di livello universitario: cura grammatica, sintassi, lessico, ritmo e fluidità, poi rilegge la bozza prima di consegnarla. “Migliora” lavora sul testo esistente; “Affidati alla Musa” crea una prima stesura originale, contestuale e sempre modificabile.", "Die Muse arbeitet nach anspruchsvollen Schreib- und Lektoratskriterien: Sie achtet auf Grammatik, Syntax, Wortwahl, Rhythmus und Lesefluss und prüft den Entwurf vor der Ausgabe erneut. „Verbessern“ arbeitet am vorhandenen Text; „Der Muse anvertrauen“ erstellt einen ersten, kontextbezogenen Entwurf, der jederzeit bearbeitet werden kann."],
    ["Gli output restano modificabili e saranno sottoposti alla supervisione umana prevista dal percorso.", "Die Ausgaben bleiben bearbeitbar und werden der im gewählten Weg vorgesehenen menschlichen Kontrolle unterzogen."],
    ["La tecnologia accompagna il percorso; la revisione professionale completa il controllo editoriale prima della consegna.", "Die Technologie begleitet den Prozess; die professionelle Überarbeitung vervollständigt die redaktionelle Kontrolle vor der Übergabe."],
    ["Salva i ricordi, chiedi alla Musa le domande giuste e lascia che Splendoria disegni l'indice.", "Speichere deine Erinnerungen, lass dir von der Muse die richtigen Fragen stellen und überlasse Splendoria die Gliederung."]
  ] : [
    ["Inserisci qui la maggiore quantità possibile di materiale concreto: date, luoghi, nomi e ruoli dei personaggi, relazioni, eventi, parole ricordate, conseguenze e ogni altro dettaglio reale. Più elementi fornisci, più la Musa potrà comporre un testo preciso, ricco e fedele alla tua voce.", "Add as much concrete material as possible here: dates, places, names and roles, relationships, events, remembered words, consequences and any other real detail. The more you provide, the more precisely and richly the Muse can shape a text that remains faithful to your voice."],
    ["placeholder=\"Chi non può mancare?\"", "placeholder=\"Who must be part of the story?\""],
    ["placeholder=\"Gli incontri, le svolte, le partenze…\"", "placeholder=\"Meetings, turning points, departures…\""],
    ["placeholder=\"Che cosa vorresti restasse nel cuore?\"", "placeholder=\"What would you like to remain in the heart?\""],
    ["placeholder=\"Racconta come se fossimo seduti davanti a un caffè…\"", "placeholder=\"Tell it as if we were sitting together over coffee…\""],
    ["placeholder=\"Qui prenderà forma il capitolo…\"", "placeholder=\"Your chapter will take shape here…\""],
    ["<span class=\"sr-only\">La tua risposta</span>", "<span class=\"sr-only\">Your answer</span>"],
    ["Premi e inizia a parlare", "Press and start speaking"],
    ["● Rispondi a voce", "● Answer by voice"],
    ["Le tue parole appariranno qui mentre scrivi o detti il capitolo.", "Your words will appear here as you write or dictate the chapter."],
    ["aria-label=\"Pagina precedente del capitolo\"", "aria-label=\"Previous chapter page\""],
    ["aria-label=\"Pagina successiva del capitolo\"", "aria-label=\"Next chapter page\""],
    ["La resa si aggiorna mentre scrivi o detti. L’impaginazione definitiva viene ricalcolata nel PDF completo dopo il salvataggio.", "The preview updates as you write or dictate. Final pagination is recalculated in the complete PDF after saving."],
    ["aria-label=\"Avanzamento del capitolo\"", "aria-label=\"Chapter progress\""],
    ["Password attuale<input", "Current password<input"],
    ["La scelta vale per tutti i pulsanti del microfono e viene ricordata su questo dispositivo.", "This choice applies to every microphone button and is remembered on this device."],
    ["La Musa lavora con criteri di scrittura ed editing di livello universitario: cura grammatica, sintassi, lessico, ritmo e fluidità, poi rilegge la bozza prima di consegnarla. “Migliora” lavora sul testo esistente; “Affidati alla Musa” crea una prima stesura originale, contestuale e sempre modificabile.", "The Muse works to demanding writing and editing standards: it checks grammar, syntax, vocabulary, rhythm and flow, then reviews the draft before returning it. “Improve” works on existing text; “Entrust to the Muse” creates an original, contextual first draft that always remains editable."],
    ["Gli output restano modificabili e saranno sottoposti alla supervisione umana prevista dal percorso.", "Outputs remain editable and are subject to the human supervision included in the chosen path."],
    ["La tecnologia accompagna il percorso; la revisione professionale completa il controllo editoriale prima della consegna.", "Technology supports the process; professional review completes the editorial check before delivery."],
    ["Salva i ricordi, chiedi alla Musa le domande giuste e lascia che Splendoria disegni l'indice.", "Save your memories, ask the Muse the right questions and let Splendoria shape the outline."]
  ];

  out = replacePairs(out, pairs);
  out = out.replace(/<span class="badge">Richiede sblocco<\/span>/g, locale === "de" ? '<span class="badge">Freischaltung erforderlich</span>' : '<span class="badge">Unlock required</span>');
  out = out.replace(/Questo capitolo sarà disponibile quando Splendoria avrà impostato il libro come “Pagato” o “Gratuito”\./g, locale === "de" ? 'Dieses Kapitel ist verfügbar, sobald Splendoria das Buch als „Bezahlt“ oder „Kostenlos“ freigeschaltet hat.' : 'This chapter will be available once Splendoria has set the book to “Paid” or “Free”.');
  out = out.replace(/<li><span aria-hidden="true">01<\/span>Ti guida con (\d+) domande calibrate sulle pagine mancanti<\/li>/g, locale === "de" ? '<li><span aria-hidden="true">01</span>Sie führt dich mit $1 auf die fehlenden Seiten abgestimmten Fragen</li>' : '<li><span aria-hidden="true">01</span>It guides you with $1 questions calibrated to the pages still missing</li>');
  out = out.replace(/<li><span aria-hidden="true">02<\/span>Calcola parole e pagine per capitolo e per il libro<\/li>/g, locale === "de" ? '<li><span aria-hidden="true">02</span>Sie berechnet Wörter und Seiten für jedes Kapitel und das gesamte Buch</li>' : '<li><span aria-hidden="true">02</span>It calculates words and pages for each chapter and for the whole book</li>');
  out = out.replace(/<li><span aria-hidden="true">03<\/span>Non aggiunge fatti, ripetizioni o testo riempitivo<\/li>/g, locale === "de" ? '<li><span aria-hidden="true">03</span>Sie fügt keine Fakten, Wiederholungen oder Fülltext hinzu</li>' : '<li><span aria-hidden="true">03</span>It does not add facts, repetitions or filler text</li>');
  out = out.replace(/Le (\d+) domande e l’obiettivo di circa ([\d.,]+) parole per risposta sono calcolati sulle ([\d.,]+) pagine ancora da completare\./g, locale === "de" ? 'Die $1 Fragen und das Ziel von etwa $2 Wörtern pro Antwort sind auf die noch fehlenden $3 Seiten abgestimmt.' : 'The $1 questions and the target of about $2 words per answer are calculated from the $3 pages still to complete.');
  out = out.replace(/Obiettivo suggerito: circa ([\d.,]+) parole, usando soltanto ricordi reali\./g, locale === "de" ? 'Empfohlenes Ziel: etwa $1 Wörter, ausschließlich auf Grundlage echter Erinnerungen.' : 'Suggested target: about $1 words, using only real memories.');
  out = out.replace(/<button class="button">✦ Genera (\d+) nuove domande<\/button>/g, locale === "de" ? '<button class="button">✦ $1 neue Fragen erzeugen</button>' : '<button class="button">✦ Generate $1 new questions</button>');
  out = out.replace(/<p class="kicker">Capitolo (\d+) · bloccato<\/p>/g, locale === "de" ? '<p class="kicker">Kapitel $1 · gesperrt</p>' : '<p class="kicker">Chapter $1 · locked</p>');
  out = out.replace(/<p class="small muted">Obiettivo: circa ([\d.,]+) pagine · ([\d.,]+) parole<\/p>/g, locale === "de" ? '<p class="small muted">Ziel: etwa $1 Seiten · $2 Wörter</p>' : '<p class="small muted">Target: about $1 pages · $2 words</p>');
  out = out.replace(/(<span class="wordcount"[^>]*>)([\d.,]+) parole(?: · ([\d.,]+) pagine stimate)?<\/span>/g, (_m, open, words, pages) => `${open}${words} ${locale === "de" ? "Wörter" : "words"}${pages ? ` · ${pages} ${locale === "de" ? "geschätzte Seiten" : "estimated pages"}` : ""}</span>`);
  out = out.replace(/(<span data-live-word-status>)([\d.,]+) parole · (\d+) pagina stimata<\/span>/g, locale === "de" ? '$1$2 Wörter · $3 geschätzte Seite</span>' : '$1$2 words · $3 estimated page</span>');
  out = out.replace(/(<span data-live-word-status>)([\d.,]+) parole · (\d+) pagine stimate<\/span>/g, locale === "de" ? '$1$2 Wörter · $3 geschätzte Seiten</span>' : '$1$2 words · $3 estimated pages</span>');

  return protectedHtml.restore(out);
}

export function localizeStudioRuntimeScript(source, locale) {
  let out = String(source || "");
  if (!LOCALES.has(locale)) return out;
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";
  out = out.replace("words + ' parole'", `words + '${locale === "de" ? " Wörter" : " words"}'`);
  out = out.replace("' pagine stimate'", `' ${locale === "de" ? "geschätzte Seiten" : "estimated pages"}'`);
  out = out.replace("toLocaleString('it-IT'", `toLocaleString('${numberLocale}'`);
  return out;
}

async function fetchEditorCopy(request, env, ctx) {
  const url = new URL(request.url);
  const response = await failsafeWorker.fetch(request, env, ctx);
  if (!response.ok) return response;
  const type = response.headers.get("content-type") || "";

  const scriptLocale = url.pathname === "/assets/studio.js" && LOCALES.has(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "";
  if (scriptLocale && type.includes("javascript")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeStudioRuntimeScript(await response.text(), scriptLocale), { status: response.status, statusText: response.statusText, headers });
  }

  const locale = pathLocale(url.pathname);
  if (!locale || !/^\/(?:de|en)\/libro\//.test(url.pathname) || /\/anteprima$/.test(url.pathname) || !type.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(localizeEditorResidualHtml(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
}

export default {
  fetch: fetchEditorCopy,
  email(message, env, ctx) { return failsafeWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return failsafeWorker.scheduled(controller, env, ctx); }
};
