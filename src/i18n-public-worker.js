import guardWorker from "./i18n-guard-worker.js";

const ORIGIN = "https://www.splendoria.vip";
const LOCALES = {
  it: { html: "it", og: "it_IT", label: "IT" },
  de: { html: "de", og: "de_DE", label: "DE" },
  en: { html: "en", og: "en_GB", label: "EN" }
};

const PUBLIC_GUIDE = "/guida";

const COMMON = [
  ["Come funziona", { de: "So funktioniert es", en: "How it works" }],
  ["Listino", { de: "Preise", en: "Pricing" }],
  ["Guida", { de: "Leitfaden", en: "Guide" }],
  ["Contattaci", { de: "Kontakt", en: "Contact" }],
  ["Il mio Studio", { de: "Mein Studio", en: "My Studio" }],
  ["Account", { de: "Konto", en: "Account" }],
  ["Esci", { de: "Abmelden", en: "Sign out" }],
  ["La tua vita in un romanzo", { de: "Dein Leben als Roman", en: "Your life as a novel" }],
  ["Guida allo Studio", { de: "Studio-Leitfaden", en: "Studio Guide" }],
  ["Termini e condizioni", { de: "Allgemeine Geschäftsbedingungen", en: "Terms and conditions" }],
  ["Note legali", { de: "Rechtliche Hinweise", en: "Legal notice" }],
  ["Trasparenza IA", { de: "KI-Transparenz", en: "AI transparency" }],
  ["Privacy, senza sorprese", { de: "Datenschutz, ohne Überraschungen", en: "Privacy, without surprises" }],
  ["Usiamo solo strumenti tecnici necessari. Niente pubblicità, niente profilazione. Le bozze possono restare sul tuo dispositivo fino a 12 mesi come copia di sicurezza.", { de: "Wir verwenden nur technisch notwendige Werkzeuge. Keine Werbung, kein Profiling. Entwürfe können als Sicherheitskopie bis zu 12 Monate auf deinem Gerät verbleiben.", en: "We use only technically necessary tools. No advertising, no profiling. Drafts may remain on your device for up to 12 months as a safety copy." }],
  ["Cookie e dati locali", { de: "Cookies und lokale Daten", en: "Cookies and local data" }],
  ["Ho capito", { de: "Verstanden", en: "Got it" }],
  ["Chiudi l’informativa privacy", { de: "Datenschutzhinweis schließen", en: "Close privacy notice" }]
];

const GUIDE = [
  ["Manuale pratico", { de: "Praktischer Leitfaden", en: "Practical guide" }],
  ["Il tuo libro, un passo alla volta", { de: "Dein Buch, Schritt für Schritt", en: "Your book, one step at a time" }],
  ["Questa guida ti accompagna senza conoscenze tecniche: raccogli i fatti, lascia che la Musa ti intervisti, crea l’indice, scrivi e rileggi il primo capitolo.", { de: "Dieser Leitfaden begleitet dich ohne technische Vorkenntnisse: Sammle die Fakten, lass dich von der Muse interviewen, erstelle die Gliederung, schreibe und überarbeite dein erstes Kapitel.", en: "This guide takes you through the process without requiring technical knowledge: gather the facts, let the Muse interview you, create the outline, write and review your first chapter." }],
  ["Crea lo Studio gratuito", { de: "Kostenloses Studio erstellen", en: "Create your free Studio" }],
  ["Apri il mio Studio", { de: "Mein Studio öffnen", en: "Open my Studio" }],
  ["Stampa o salva la guida in PDF", { de: "Leitfaden drucken oder als PDF speichern", en: "Print or save the guide as PDF" }],
  ["Indice della guida", { de: "Inhaltsverzeichnis des Leitfadens", en: "Guide contents" }],
  ["Vai direttamente", { de: "Direkt zu", en: "Jump to" }],
  ["Cominciare", { de: "Beginnen", en: "Getting started" }],
  ["Preparare i ricordi", { de: "Erinnerungen vorbereiten", en: "Preparing your memories" }],
  ["Usare la Musa", { de: "Die Muse verwenden", en: "Using the Muse" }],
  ["Rivedere il testo", { de: "Text überarbeiten", en: "Reviewing the text" }],
  ["Capire la prova", { de: "Testphase verstehen", en: "Understanding the trial" }],
  ["Risolvere i problemi", { de: "Probleme lösen", en: "Troubleshooting" }],
  ["Passo 1", { de: "Schritt 1", en: "Step 1" }],
  ["Crea il progetto", { de: "Projekt anlegen", en: "Create the project" }],
  ["Registrati con nome, email e una password di almeno dieci caratteri.", { de: "Registriere dich mit deinem Namen, deiner E-Mail-Adresse und einem Passwort mit mindestens zehn Zeichen.", en: "Register with your name, email address and a password of at least ten characters." }],
  ["Nello Studio inserisci un titolo provvisorio, scegli il genere e la struttura da 12 o 18 capitoli.", { de: "Gib im Studio einen vorläufigen Titel ein und wähle Genre sowie eine Struktur mit 12 oder 18 Kapiteln.", en: "In the Studio, enter a working title and choose the genre and a 12- or 18-chapter structure." }],
  ["Apri il progetto. Titolo, tono e pubblico potranno essere cambiati in seguito.", { de: "Öffne das Projekt. Titel, Ton und Zielpublikum kannst du später noch ändern.", en: "Open the project. You can change the title, tone and audience later." }],
  ["Non serve avere già scritto un testo.", { de: "Du musst noch keinen Text geschrieben haben.", en: "You do not need to have written anything yet." }],
  ["Puoi iniziare da ricordi sparsi, oppure usare la dettatura se preferisci raccontare a voce.", { de: "Du kannst mit einzelnen Erinnerungen beginnen oder die Diktierfunktion nutzen, wenn du lieber erzählst.", en: "You can start with scattered memories, or use dictation if you prefer to tell your story aloud." }],
  ["Passo 2", { de: "Schritt 2", en: "Step 2" }],
  ["Affida fatti sufficienti", { de: "Genügend konkrete Fakten bereitstellen", en: "Provide enough concrete facts" }],
  ["La Musa non deve inventare la tua vita. Prima di chiederle un capitolo, inserisci almeno circa 260–460 parole di materiale concreto e vario, in base alla lunghezza prevista.", { de: "Die Muse soll dein Leben nicht erfinden. Bevor du sie um ein Kapitel bittest, stelle – abhängig von der vorgesehenen Länge – ungefähr 260–460 Wörter konkretes und vielfältiges Ausgangsmaterial bereit.", en: "The Muse must not invent your life. Before asking it to write a chapter, provide roughly 260–460 words of concrete, varied source material, depending on the intended length." }],
  ["Persone:", { de: "Personen:", en: "People:" }],
  ["nomi, ruoli, relazioni e caratteristiche realmente ricordate.", { de: "Namen, Rollen, Beziehungen und Eigenschaften, an die du dich tatsächlich erinnerst.", en: "names, roles, relationships and characteristics you genuinely remember." }],
  ["Tempo e luoghi:", { de: "Zeit und Orte:", en: "Time and places:" }],
  ["anni, periodi, città, case, ambienti.", { de: "Jahre, Zeiträume, Städte, Häuser und Umgebungen.", en: "years, periods, towns, homes and settings." }],
  ["Azioni e conseguenze:", { de: "Handlungen und Folgen:", en: "Actions and consequences:" }],
  ["che cosa accadde, chi fece cosa e che cosa cambiò.", { de: "was geschah, wer was tat und was sich dadurch veränderte.", en: "what happened, who did what and what changed as a result." }],
  ["Parole ricordate:", { de: "Erinnerte Worte:", en: "Remembered words:" }],
  ["usa le virgolette solo per dialoghi realmente forniti.", { de: "Verwende Anführungszeichen nur für tatsächlich überlieferte oder von dir angegebene Dialoge.", en: "use quotation marks only for dialogue that you have actually provided." }],
  ["Senso:", { de: "Bedeutung:", en: "Meaning:" }],
  ["che cosa hai compreso e che cosa vuoi lasciare al lettore.", { de: "was du verstanden hast und was du dem Leser mitgeben möchtest.", en: "what you came to understand and what you want to leave with the reader." }],
  ["Se le informazioni non bastano, Splendoria non sostituisce il capitolo con un testo generico: ti chiede di aggiungere altri dati o di completare l’intervista.", { de: "Wenn die Informationen nicht ausreichen, ersetzt Splendoria das Kapitel nicht durch einen allgemeinen Text: Du wirst gebeten, weitere Angaben hinzuzufügen oder das Interview zu vervollständigen.", en: "If there is not enough information, Splendoria does not replace the chapter with generic prose: it asks you to add more material or complete the interview." }],
  ["Passi 3–5", { de: "Schritte 3–5", en: "Steps 3–5" }],
  ["Dall’intervista al capitolo", { de: "Vom Interview zum Kapitel", en: "From interview to chapter" }],
  ["Salva i ricordi.", { de: "Erinnerungen speichern.", en: "Save your memories." }],
  ["Dopo aver confermato la liceità dei contenuti, il salvataggio automatico custodisce le modifiche mentre scrivi.", { de: "Nachdem du die Rechtmäßigkeit der Inhalte bestätigt hast, sichert die automatische Speicherung deine Änderungen während des Schreibens.", en: "After confirming that you are entitled to use the content, autosave protects your changes while you write." }],
  ["Genera l’intervista.", { de: "Interview erstellen.", en: "Generate the interview." }],
  ["Rispondi alle domande una alla volta. Puoi scrivere, dettare oppure chiedere una base alla Musa quando le fonti sono sufficienti.", { de: "Beantworte die Fragen nacheinander. Du kannst schreiben, diktieren oder – sobald genügend Quellen vorhanden sind – die Muse um einen Entwurf bitten.", en: "Answer the questions one at a time. You can type, dictate or ask the Muse for a starting draft once there is enough source material." }],
  ["Disegna la trama.", { de: "Buchstruktur entwerfen.", en: "Shape the story." }],
  ["“Disegna la trama del mio libro” crea l’indice completo. Rileggi i titoli prima di proseguire.", { de: "„Zeichne die Struktur meines Buches“ erstellt die vollständige Gliederung. Lies die Kapitelüberschriften noch einmal, bevor du fortfährst.", en: "“Shape the structure of my book” creates the full outline. Review the chapter titles before continuing." }],
  ["Apri il primo capitolo.", { de: "Erstes Kapitel öffnen.", en: "Open the first chapter." }],
  ["Scrivi direttamente oppure premi “Affidati alla Musa”. Attendi la scrittura e la rilettura finale senza chiudere la pagina.", { de: "Schreibe selbst oder wähle „Der Muse anvertrauen“. Warte auf den Schreibvorgang und die abschließende Überarbeitung, ohne die Seite zu schließen.", en: "Write directly or select “Entrust it to the Muse”. Wait for the writing and final review to finish without closing the page." }],
  ["Detta", { de: "Diktieren", en: "Dictate" }],
  ["Trasforma la voce in testo; se il browser non lo consente, scrivi nel campo.", { de: "Wandelt deine Stimme in Text um; wenn dein Browser dies nicht unterstützt, schreibe direkt in das Feld.", en: "Turns your voice into text; if your browser does not support it, type into the field instead." }],
  ["Migliora", { de: "Verbessern", en: "Improve" }],
  ["Rende più fluido il testo già presente, senza aggiungere fatti.", { de: "Macht den vorhandenen Text flüssiger, ohne neue Fakten hinzuzufügen.", en: "Makes the existing text flow more smoothly without adding facts." }],
  ["Affidati alla Musa", { de: "Der Muse anvertrauen", en: "Entrust it to the Muse" }],
  ["Crea una nuova bozza soltanto dalle fonti autorizzate.", { de: "Erstellt einen neuen Entwurf ausschließlich aus den autorisierten Quellen.", en: "Creates a new draft using only the authorised sources." }],
  ["Salva", { de: "Speichern", en: "Save" }],
  ["Conferma subito le modifiche; l’autosalvataggio resta una protezione aggiuntiva.", { de: "Speichert deine Änderungen sofort; die automatische Speicherung bleibt eine zusätzliche Absicherung.", en: "Confirms your changes immediately; autosave remains an additional safeguard." }],
  ["Passo 6", { de: "Schritt 6", en: "Step 6" }],
  ["Rileggi come autore", { de: "Als Autor gegenlesen", en: "Review as the author" }],
  ["Controlla sempre nomi, date, luoghi, citazioni, relazioni e ordine degli eventi. Poi usa “Correggi grammatica”: il revisore interviene su ortografia, sintassi, concordanze, reggenze e punteggiatura, conservando fatti e voce.", { de: "Prüfe immer Namen, Daten, Orte, Zitate, Beziehungen und die Reihenfolge der Ereignisse. Verwende anschließend „Grammatik korrigieren“: Die Überarbeitung verbessert Rechtschreibung, Syntax, grammatische Übereinstimmung, Rektion und Zeichensetzung, ohne Fakten oder Stimme zu verändern.", en: "Always check names, dates, places, quotations, relationships and the order of events. Then use “Correct grammar”: the reviewer works on spelling, syntax, agreement, grammar and punctuation while preserving facts and voice." }],
  ["Splendoria applica un controllo specifico sugli ausiliari italiani: scrive, per esempio, “siamo usciti” e “siamo andati”, mai “abbiamo uscito” o “abbiamo andato”. Se una revisione non supera il controllo di fedeltà, il testo originale resta intatto e compare un avviso.", { de: "Wenn das Buch auf Italienisch geschrieben wird, prüft Splendoria zusätzlich die korrekte Verwendung italienischer Hilfsverben – zum Beispiel „siamo usciti“ und „siamo andati“, niemals „abbiamo uscito“ oder „abbiamo andato“. Besteht eine Überarbeitung die Treueprüfung nicht, bleibt der Originaltext unverändert und es erscheint ein Hinweis.", en: "When the book is written in Italian, Splendoria also applies a specific check to Italian auxiliary verbs—for example, “siamo usciti” and “siamo andati”, never “abbiamo uscito” or “abbiamo andato”. If a revision fails the fidelity check, the original text remains unchanged and a warning is shown." }],
  ["Infine apri “Sfoglia l’anteprima”. Il comando di stampa del browser permette di salvare l’opera in PDF A5; usa scala 100% e disattiva intestazioni e piè di pagina.", { de: "Öffne anschließend „Vorschau durchblättern“. Über den Druckdialog des Browsers kannst du das Werk als A5-PDF speichern; verwende 100 % Skalierung und deaktiviere Kopf- und Fußzeilen.", en: "Finally, open “Browse preview”. Your browser’s print command lets you save the work as an A5 PDF; use 100% scale and turn off headers and footers." }],
  ["Regole chiare", { de: "Klare Regeln", en: "Clear rules" }],
  ["Prova gratuita e sblocco", { de: "Kostenlose Testphase und Freischaltung", en: "Free trial and unlocking" }],
  ["La prova vale per il primo progetto creato dall’account.", { de: "Die Testphase gilt für das erste im Konto angelegte Projekt.", en: "The trial applies to the first project created in the account." }],
  ["I capitoli successivi e il progetto scaduto si aprono dopo lo sblocco amministrativo “Pagato” o “Gratuito”.", { de: "Weitere Kapitel und ein abgelaufenes Projekt werden nach der administrativen Freischaltung als „Bezahlt“ oder „Kostenlos“ geöffnet.", en: "Later chapters and an expired project become available after administrative unlocking as “Paid” or “Free”." }],
  ["Per ora il pagamento avviene tramite bonifico. Scegli la formula nello Studio: lì compariranno le coordinate e la causale. Dopo la verifica manuale, Splendoria sblocca l’intero libro.", { de: "Derzeit erfolgt die Zahlung per Banküberweisung. Wähle im Studio dein Programm; dort erscheinen die Bankverbindung und der Verwendungszweck. Nach der manuellen Prüfung schaltet Splendoria das gesamte Buch frei.", en: "For now, payment is made by bank transfer. Choose your programme in the Studio; the bank details and payment reference will appear there. After manual verification, Splendoria unlocks the full book." }],
  ["Aiuto immediato", { de: "Soforthilfe", en: "Immediate help" }],
  ["Se qualcosa non funziona", { de: "Wenn etwas nicht funktioniert", en: "If something is not working" }],
  ["La Musa non scrive il capitolo", { de: "Die Muse schreibt das Kapitel nicht", en: "The Muse is not writing the chapter" }],
  ["Nel capitolo scrivi almeno 50 parole di spunto complessive nelle tre sezioni; le 260–460 parole restano invece una raccomandazione per il materiale generale del libro. Controlla inoltre di essere ancora nei 14 giorni, di non aver esaurito le tre generazioni e di trovarti nel primo capitolo oppure in un libro sbloccato.", { de: "Schreibe im Kapitel insgesamt mindestens 50 Wörter als Ausgangspunkt über die drei Abschnitte verteilt; die 260–460 Wörter bleiben dagegen eine Empfehlung für das allgemeine Quellenmaterial des Buches. Prüfe außerdem, ob du noch innerhalb der 14 Tage bist, die drei Generierungen noch nicht aufgebraucht hast und dich im ersten Kapitel oder in einem freigeschalteten Buch befindest.", en: "Write at least 50 words of source material across the three chapter sections; the 260–460 words remain a recommendation for the book’s general source material. Also check that you are still within the 14-day period, have not used all three generations, and are working in the first chapter or an unlocked book." }],
  ["La dettatura non parte", { de: "Diktieren startet nicht", en: "Dictation does not start" }],
  ["Consenti il microfono nelle impostazioni del browser. La dettatura dipende dal supporto del dispositivo: il campo di testo resta sempre disponibile come alternativa.", { de: "Erlaube den Mikrofonzugriff in den Browsereinstellungen. Die Diktierfunktion hängt von der Unterstützung des Geräts ab; das Textfeld bleibt immer als Alternative verfügbar.", en: "Allow microphone access in your browser settings. Dictation depends on device support; the text field is always available as an alternative." }],
  ["Il salvataggio automatico segnala un errore", { de: "Die automatische Speicherung meldet einen Fehler", en: "Autosave reports an error" }],
  ["Verifica la connessione e premi “Salva le mie modifiche”. Non chiudere la pagina finché non compare la conferma.", { de: "Prüfe deine Verbindung und wähle „Meine Änderungen speichern“. Schließe die Seite erst, wenn die Bestätigung erscheint.", en: "Check your connection and select “Save my changes”. Do not close the page until the confirmation appears." }],
  ["Il testo contiene un fatto inesatto", { de: "Der Text enthält eine falsche Tatsache", en: "The text contains an incorrect fact" }],
  ["Correggilo direttamente, poi salva. Se vuoi intervenire solo sulla lingua, usa “Correggi grammatica” e rileggi il risultato.", { de: "Korrigiere die Stelle direkt und speichere anschließend. Wenn du nur die Sprache bearbeiten möchtest, verwende „Grammatik korrigieren“ und lies das Ergebnis noch einmal.", en: "Correct it directly, then save. If you only want to edit the language, use “Correct grammar” and review the result." }],
  ["Non ricevo un’email", { de: "Ich erhalte keine E-Mail", en: "I am not receiving an email" }],
  ["Controlla spam e posta indesiderata. Dopo cinque minuti riprova dalla funzione disponibile oppure scrivi a", { de: "Prüfe Spam und Junk-Mail. Versuche es nach fünf Minuten erneut über die entsprechende Funktion oder schreibe an", en: "Check spam and junk mail. After five minutes, try the available function again or write to" }],
  ["Non trovi la risposta? Scrivi a", { de: "Du findest keine Antwort? Schreib an", en: "Cannot find the answer? Write to" }],
  [", indicando l’email dell’account e il titolo del progetto, senza inviare la password.", { de: ", und nenne die E-Mail-Adresse deines Kontos sowie den Projekttitel. Sende niemals dein Passwort mit.", en: ", including the account email address and project title, without sending your password." }]
];

const META = {
  de: { title: "Studio-Leitfaden — Splendoria", description: "Praktischer Leitfaden für das Splendoria Studio: Erinnerungen sammeln, mit der Muse arbeiten, Kapitel schreiben, prüfen und als A5-PDF ausgeben." },
  en: { title: "Studio Guide — Splendoria", description: "Practical guide to the Splendoria Studio: gather memories, work with the Muse, write and review chapters, and export an A5 PDF." }
};

function applyPairs(html, locale, pairs) {
  let out = html;
  for (const [it, target] of pairs) {
    const translated = target[locale];
    if (translated) out = out.split(it).join(translated);
  }
  return out;
}

function routeLocale(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  if (!match) return null;
  return { locale: match[1], basePath: match[2] || "/" };
}

function cloneToBasePath(request, basePath) {
  const target = new URL(request.url);
  target.pathname = basePath;
  return new Request(target.toString(), request);
}

function samePageSwitcher(locale, basePath) {
  const href = key => key === "it" ? basePath : `/${key}${basePath}`;
  return `<nav class="spl-language-switcher" aria-label="${locale === "de" ? "Sprache" : "Language"}">${["it", "de", "en"].map(key => `<a class="spl-lang-link${key === locale ? " is-current" : ""}" href="${href(key)}" hreflang="${LOCALES[key].html}" lang="${LOCALES[key].html}"${key === locale ? ' aria-current="page"' : ""}>${LOCALES[key].label}</a>`).join("")}</nav>`;
}

function injectSwitcher(html, locale, basePath) {
  const css = `<style data-spl-i18n-nav>.spl-language-switcher{display:flex;align-items:center;gap:5px;margin-left:auto;padding:2px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.06)}.spl-lang-link{display:inline-flex;align-items:center;justify-content:center;min-width:38px;min-height:31px;padding:5px 8px;border-radius:999px;color:#dce9e3!important;font:800 12px/1 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.06em;text-decoration:none!important}.spl-lang-link:hover{background:rgba(255,255,255,.12)}.spl-lang-link.is-current{background:#c5a059;color:#10261d!important}@media(max-width:760px){.spl-language-switcher{order:2;margin-left:0}.navlinks{order:3}.navin{justify-content:space-between}}</style>`;
  let out = html.replace(/<\/head>/i, `${css}</head>`);
  out = out.replace(/(<a class="brand"[^>]*>Splendoria<\/a>)/i, `$1${samePageSwitcher(locale, basePath)}`);
  return out;
}

function localizePageLinks(html, locale, basePath) {
  const prefix = `/${locale}`;
  let out = html
    .replace(/href="\/\#(metodo|formule|contatti)"/g, `href="${prefix}/#$1"`)
    .replace(/href="\/guida"/g, `href="${prefix}/guida"`);
  out = out.replace(/(<a class="brand" href=")\/(">Splendoria<\/a>)/i, `$1${prefix}/$2`);
  return out;
}

function injectSeo(html, locale, basePath, meta) {
  const canonical = `${ORIGIN}/${locale}${basePath}`;
  const alternates = `<link rel="alternate" hreflang="it" href="${ORIGIN}${basePath}"><link rel="alternate" hreflang="de" href="${ORIGIN}/de${basePath}"><link rel="alternate" hreflang="en" href="${ORIGIN}/en${basePath}"><link rel="alternate" hreflang="x-default" href="${ORIGIN}${basePath}">`;
  let out = html.replace(/<html lang="[^"]+">/i, `<html lang="${locale}">`);
  out = out.replace(/<link rel="canonical" href="[^"]*">/i, "");
  out = out.replace(/<head([^>]*)>/i, `<head$1>${alternates}<link rel="canonical" href="${canonical}">`);
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${meta.description}">`);
  out = out.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${LOCALES[locale].og}">`);
  out = out.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
  out = out.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${meta.title}">`);
  out = out.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${meta.description}">`);
  out = out.replace(/<meta name="twitter:title" content="[^"]*">/i, `<meta name="twitter:title" content="${meta.title}">`);
  out = out.replace(/<meta name="twitter:description" content="[^"]*">/i, `<meta name="twitter:description" content="${meta.description}">`);
  return out;
}

function translateGuide(html, locale) {
  let out = applyPairs(html, locale, [...COMMON, ...GUIDE]);
  if (locale === "de") {
    out = out
      .replace(/Dura (\d+) giorni dalla creazione del progetto\./, "Die Testphase dauert $1 Tage ab der Erstellung des Projekts.")
      .replace(/Permette di lavorare sul primo capitolo e comprende fino a (\d+) generazioni di capitolo complessive\./, "Du kannst am ersten Kapitel arbeiten und insgesamt bis zu $1 Kapitelgenerierungen nutzen.");
  } else {
    out = out
      .replace(/Dura (\d+) giorni dalla creazione del progetto\./, "It lasts $1 days from the creation of the project.")
      .replace(/Permette di lavorare sul primo capitolo e comprende fino a (\d+) generazioni di capitolo complessive\./, "It lets you work on the first chapter and includes up to $1 chapter generations in total.");
  }
  return out;
}

function polishLocalizedHome(html, locale) {
  if (locale === "de") {
    return html
      .replace("Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»")
      .replace("Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»")
      .replace("Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»")
      .replace("Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»")
      .replace("La richiesta è stata registrata, ma l’email non è stata consegnata. Riprova tra poco oppure scrivi a", "Die Anfrage wurde gespeichert, aber die E-Mail konnte nicht zugestellt werden. Bitte versuche es in Kürze erneut oder schreibe an")
      .replace(/(<a class="brand" href=")\/(">Splendoria<\/a>)/i, "$1/de/$2");
  }
  return html
    .replace("Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "She had already been at the stove for hours. When we arrived, the house was full of aromas: the sauce simmering slowly, the meat…”")
    .replace("La richiesta è stata registrata, ma l’email non è stata consegnata. Riprova tra poco oppure scrivi a", "The request was saved, but the email could not be delivered. Please try again shortly or write to")
    .replace(/(<a class="brand" href=")\/(">Splendoria<\/a>)/i, "$1/en/$2");
}

async function fetchPublic(request, env, ctx) {
  const url = new URL(request.url);
  const localized = routeLocale(url.pathname);

  if (request.method === "GET" && (url.pathname === "/de/" || url.pathname === "/en/")) {
    const response = await guardWorker.fetch(request, env, ctx);
    if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(polishLocalizedHome(await response.text(), url.pathname.slice(1, 3)), { status: response.status, statusText: response.statusText, headers });
  }

  if (!localized || localized.basePath !== PUBLIC_GUIDE || request.method !== "GET") return guardWorker.fetch(request, env, ctx);

  const upstream = await guardWorker.fetch(cloneToBasePath(request, PUBLIC_GUIDE), env, ctx);
  if (!upstream.ok || !(upstream.headers.get("content-type") || "").includes("text/html")) return upstream;
  let html = await upstream.text();
  html = translateGuide(html, localized.locale);
  html = localizePageLinks(html, localized.locale, PUBLIC_GUIDE);
  html = injectSeo(html, localized.locale, PUBLIC_GUIDE, META[localized.locale]);
  html = injectSwitcher(html, localized.locale, PUBLIC_GUIDE);
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("vary");
  headers.set("content-language", localized.locale);
  headers.set("cache-control", "public, max-age=300, stale-while-revalidate=600");
  return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers });
}

export default {
  fetch: fetchPublic,
  email(message, env, ctx) { return guardWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return guardWorker.scheduled(controller, env, ctx); }
};
