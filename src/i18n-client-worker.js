import authWorker from "./i18n-auth-worker.js";

const CLIENT_PATHS = new Set([
  "/studio",
  "/account",
  "/account/profilo",
  "/account/email",
  "/account/cancella",
  "/account/esporta.json",
  "/logout"
]);

const PUBLIC_AND_AUTH_PATHS = [
  "/registrati", "/area-clienti", "/password-dimenticata", "/reimposta-password",
  "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"
];

const COPY = {
  de: [
    ["Nome aggiornato correttamente.", "Name wurde erfolgreich aktualisiert."],
    ["Inserisci un indirizzo email valido.", "Gib eine gültige E-Mail-Adresse ein."],
    ["Questo indirizzo è riservato all’amministrazione.", "Diese E-Mail-Adresse ist der Administration vorbehalten."],
    ["Troppi tentativi. Attendi 15 minuti e riprova.", "Zu viele Versuche. Warte 15 Minuten und versuche es erneut."],
    ["La password attuale non è corretta.", "Das aktuelle Passwort ist nicht korrekt."],
    ["Sei uscito dal tuo Studio. Puoi rientrare con le stesse credenziali.", "Du hast dein Studio verlassen. Du kannst dich mit denselben Zugangsdaten erneut anmelden."],
    ["Profilo e riservatezza", "Profil und Datenschutz"],
    ["Il mio account", "Mein Konto"],
    ["Gestisci in autonomia i dati di accesso e una copia dei tuoi contenuti.", "Verwalte deine Zugangsdaten und eine Kopie deiner Inhalte selbstständig."],
    ["Torna allo Studio", "Zurück zum Studio"],
    ["Riepilogo account", "Kontoübersicht"],
    ["Indirizzo verificato", "Adresse bestätigt"],
    ["Verifica in attesa", "Bestätigung ausstehend"],
    ["Progetti", "Projekte"],
    ["Ordini", "Bestellungen"],
    ["Account creato", "Konto erstellt"],
    ["Profilo", "Profil"],
    ["Come vuoi essere chiamato", "Wie möchtest du genannt werden?"],
    ["Salva il nome", "Namen speichern"],
    ["Accesso", "Zugang"],
    ["Cambia indirizzo email", "E-Mail-Adresse ändern"],
    ["Per sicurezza chiediamo la password attuale. Il nuovo indirizzo dovrà essere verificato prima di poter usare nuovamente la Musa.", "Aus Sicherheitsgründen fragen wir nach deinem aktuellen Passwort. Die neue Adresse muss bestätigt werden, bevor du die Muse wieder verwenden kannst."],
    ["Nuova email", "Neue E-Mail-Adresse"],
    ["Password attuale", "Aktuelles Passwort"],
    ["Mostra password", "Passwort anzeigen"],
    ["Aggiorna e verifica", "Aktualisieren und bestätigen"],
    ["I tuoi dati", "Deine Daten"],
    ["Scarica una copia", "Kopie herunterladen"],
    ["Ottieni un file JSON con profilo, progetti, interviste, capitoli e ordini. Password, sessioni e note amministrative non sono incluse.", "Du erhältst eine JSON-Datei mit Profil, Projekten, Interviews, Kapiteln und Bestellungen. Passwörter, Sitzungen und administrative Notizen sind nicht enthalten."],
    ["Esporta i miei dati", "Meine Daten exportieren"],
    ["Zona riservata · cancella l’account", "Geschützter Bereich · Konto löschen"],
    ["Cancellazione permanente", "Dauerhafte Löschung"],
    ["Elimineremo accesso, progetti, ricordi, interviste e capitoli. L’operazione non può essere annullata. Gli eventuali ordini già conclusi saranno conservati soltanto in forma anonimizzata per gli obblighi civilistici e fiscali.", "Zugang, Projekte, Erinnerungen, Interviews und Kapitel werden gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden. Bereits abgeschlossene Bestellungen werden nur in anonymisierter Form für zivil- und steuerrechtliche Pflichten aufbewahrt."],
    ["Scrivi CANCELLA per confermare", "Tippe CANCELLA zur Bestätigung"],
    ["Cancella definitivamente il mio account", "Mein Konto endgültig löschen"],
    ["Per esercitare altri diritti o risolvere un problema, consulta la", "Um weitere Rechte auszuüben oder ein Problem zu lösen, lies die"],
    ["o scrivi a", "oder schreibe an"],
    ["Non inviare mai la password.", "Sende niemals dein Passwort."],
    ["Il tuo Studio", "Mein Studio"],
    ["Ciao, ", "Hallo, "],
    ["autore", "Autor"],
    ["Qui puoi creare, modificare e completare i tuoi libri in autonomia.", "Hier kannst du deine Bücher selbstständig erstellen, bearbeiten und fertigstellen."],
    ["La tua storia comincia qui", "Deine Geschichte beginnt hier"],
    ["Imposta il libro in meno di due minuti. Potrai cambiare tutto in seguito.", "Richte dein Buch in weniger als zwei Minuten ein. Du kannst später alles ändern."],
    ["Crea un nuovo libro", "Neues Buch erstellen"],
    ["Titolo provvisorio", "Arbeitstitel"],
    ["La mia storia", "Meine Geschichte"],
    ["Genere", "Genre"],
    ["Struttura del libro", "Buchstruktur"],
    ["Personalizza la struttura", "Struktur anpassen"],
    ["12 capitoli · circa 7 pagine ciascuno", "12 Kapitel · etwa 7 Seiten je Kapitel"],
    ["18 capitoli · circa 6–7 pagine ciascuno", "18 Kapitel · etwa 6–7 Seiten je Kapitel"],
    ["Entrambe le strutture producono un libro fra 80 e 120 pagine effettive, compresi frontespizio e indice.", "Beide Strukturen ergeben ein Buch mit etwa 80 bis 120 tatsächlichen Seiten einschließlich Titelblatt und Inhaltsverzeichnis."],
    ["La prova gratuita vale per questo primo progetto.", "Die kostenlose Testphase gilt für dieses erste Projekt."],
    ["La prova gratuita è unica per account; per un altro progetto potrai scegliere la formula prima di usare la Musa.", "Die kostenlose Testphase ist einmal pro Konto verfügbar; für ein weiteres Projekt kannst du vor der Nutzung der Muse ein Programm wählen."],
    ["Crea il progetto gratuito", "Kostenloses Projekt erstellen"],
    ["Crea un altro progetto", "Weiteres Projekt erstellen"],
    ["Libro sbloccato", "Buch freigeschaltet"],
    ["Continua il libro", "Buch fortsetzen"],
    ["Prova gratuita · solo primo capitolo", "Kostenlose Testphase · nur erstes Kapitel"],
    ["Prova gratuita conclusa", "Kostenlose Testphase beendet"],
    ["Bonifico in attesa", "Überweisung ausstehend"],
    ["Formula da scegliere", "Programm auswählen"],
    ["Puoi creare gratuitamente il primo capitolo; gli altri si sbloccano dopo la conferma di Splendoria.", "Du kannst das erste Kapitel kostenlos erstellen; die weiteren Kapitel werden nach Bestätigung durch Splendoria freigeschaltet."],
    ["Il periodo gratuito è terminato. Il progetto resta custodito e puoi scegliere una formula per proseguire.", "Die kostenlose Phase ist beendet. Dein Projekt bleibt gespeichert und du kannst ein Programm auswählen, um fortzufahren."],
    ["Il progetto si sbloccherà dopo la verifica manuale del bonifico.", "Das Projekt wird nach der manuellen Prüfung der Überweisung freigeschaltet."],
    ["Scegli la formula adatta al libro per richiederne lo sblocco.", "Wähle das passende Programm für dein Buch, um die Freischaltung anzufordern."],
    ["Continua il primo capitolo", "Erstes Kapitel fortsetzen"],
    ["Apri il progetto", "Projekt öffnen"],
    ["Libro senza titolo", "Buch ohne Titel"],
    ["parole", "Wörter"],
    ["pagine stimate", "geschätzte Seiten"]
  ],
  en: [
    ["Nome aggiornato correttamente.", "Name updated successfully."],
    ["Inserisci un indirizzo email valido.", "Enter a valid email address."],
    ["Questo indirizzo è riservato all’amministrazione.", "This email address is reserved for administration."],
    ["Troppi tentativi. Attendi 15 minuti e riprova.", "Too many attempts. Wait 15 minutes and try again."],
    ["La password attuale non è corretta.", "The current password is incorrect."],
    ["Sei uscito dal tuo Studio. Puoi rientrare con le stesse credenziali.", "You have signed out of your Studio. You can sign in again with the same credentials."],
    ["Profilo e riservatezza", "Profile and privacy"],
    ["Il mio account", "My account"],
    ["Gestisci in autonomia i dati di accesso e una copia dei tuoi contenuti.", "Manage your sign-in details and a copy of your content yourself."],
    ["Torna allo Studio", "Back to Studio"],
    ["Riepilogo account", "Account summary"],
    ["Indirizzo verificato", "Address verified"],
    ["Verifica in attesa", "Verification pending"],
    ["Progetti", "Projects"],
    ["Ordini", "Orders"],
    ["Account creato", "Account created"],
    ["Profilo", "Profile"],
    ["Come vuoi essere chiamato", "How would you like to be addressed?"],
    ["Salva il nome", "Save name"],
    ["Accesso", "Access"],
    ["Cambia indirizzo email", "Change email address"],
    ["Per sicurezza chiediamo la password attuale. Il nuovo indirizzo dovrà essere verificato prima di poter usare nuovamente la Musa.", "For security, we ask for your current password. The new address must be verified before you can use the Muse again."],
    ["Nuova email", "New email address"],
    ["Password attuale", "Current password"],
    ["Mostra password", "Show password"],
    ["Aggiorna e verifica", "Update and verify"],
    ["I tuoi dati", "Your data"],
    ["Scarica una copia", "Download a copy"],
    ["Ottieni un file JSON con profilo, progetti, interviste, capitoli e ordini. Password, sessioni e note amministrative non sono incluse.", "Get a JSON file containing your profile, projects, interviews, chapters and orders. Passwords, sessions and administrative notes are not included."],
    ["Esporta i miei dati", "Export my data"],
    ["Zona riservata · cancella l’account", "Restricted area · delete account"],
    ["Cancellazione permanente", "Permanent deletion"],
    ["Elimineremo accesso, progetti, ricordi, interviste e capitoli. L’operazione non può essere annullata. Gli eventuali ordini già conclusi saranno conservati soltanto in forma anonimizzata per gli obblighi civilistici e fiscali.", "Access, projects, memories, interviews and chapters will be deleted. This cannot be undone. Any completed orders will be retained only in anonymised form for civil-law and tax obligations."],
    ["Scrivi CANCELLA per confermare", "Type CANCELLA to confirm"],
    ["Cancella definitivamente il mio account", "Permanently delete my account"],
    ["Per esercitare altri diritti o risolvere un problema, consulta la", "To exercise other rights or resolve a problem, read the"],
    ["o scrivi a", "or write to"],
    ["Non inviare mai la password.", "Never send your password."],
    ["Il tuo Studio", "My Studio"],
    ["Ciao, ", "Hello, "],
    ["autore", "author"],
    ["Qui puoi creare, modificare e completare i tuoi libri in autonomia.", "Here you can create, edit and complete your books independently."],
    ["La tua storia comincia qui", "Your story starts here"],
    ["Imposta il libro in meno di due minuti. Potrai cambiare tutto in seguito.", "Set up your book in under two minutes. You can change everything later."],
    ["Crea un nuovo libro", "Create a new book"],
    ["Titolo provvisorio", "Working title"],
    ["La mia storia", "My story"],
    ["Genere", "Genre"],
    ["Struttura del libro", "Book structure"],
    ["Personalizza la struttura", "Customise structure"],
    ["12 capitoli · circa 7 pagine ciascuno", "12 chapters · about 7 pages each"],
    ["18 capitoli · circa 6–7 pagine ciascuno", "18 chapters · about 6–7 pages each"],
    ["Entrambe le strutture producono un libro fra 80 e 120 pagine effettive, compresi frontespizio e indice.", "Both structures produce a book of roughly 80 to 120 actual pages, including the title page and contents."],
    ["La prova gratuita vale per questo primo progetto.", "The free trial applies to this first project."],
    ["La prova gratuita è unica per account; per un altro progetto potrai scegliere la formula prima di usare la Musa.", "The free trial is available once per account; for another project you can choose a programme before using the Muse."],
    ["Crea il progetto gratuito", "Create free project"],
    ["Crea un altro progetto", "Create another project"],
    ["Libro sbloccato", "Book unlocked"],
    ["Continua il libro", "Continue book"],
    ["Prova gratuita · solo primo capitolo", "Free trial · first chapter only"],
    ["Prova gratuita conclusa", "Free trial ended"],
    ["Bonifico in attesa", "Bank transfer pending"],
    ["Formula da scegliere", "Choose a programme"],
    ["Puoi creare gratuitamente il primo capitolo; gli altri si sbloccano dopo la conferma di Splendoria.", "You can create the first chapter for free; the remaining chapters unlock after confirmation from Splendoria."],
    ["Il periodo gratuito è terminato. Il progetto resta custodito e puoi scegliere una formula per proseguire.", "The free period has ended. Your project remains stored and you can choose a programme to continue."],
    ["Il progetto si sbloccherà dopo la verifica manuale del bonifico.", "The project will unlock after the bank transfer has been checked manually."],
    ["Scegli la formula adatta al libro per richiederne lo sblocco.", "Choose the programme that suits the book to request unlocking."],
    ["Continua il primo capitolo", "Continue first chapter"],
    ["Apri il progetto", "Open project"],
    ["Libro senza titolo", "Untitled book"],
    ["parole", "words"],
    ["pagine stimate", "estimated pages"]
  ]
};

const GENRES = {
  de: {
    "Autobiografia": "Autobiografie",
    "Memoriale": "Memoiren",
    "Romanzo": "Roman",
    "Storia di famiglia": "Familiengeschichte",
    "Biografia aziendale": "Unternehmensbiografie"
  },
  en: {
    "Autobiografia": "Autobiography",
    "Memoriale": "Memoir",
    "Romanzo": "Novel",
    "Storia di famiglia": "Family history",
    "Biografia aziendale": "Company biography"
  }
};

const MONTHS = {
  de: { gennaio: "Januar", febbraio: "Februar", marzo: "März", aprile: "April", maggio: "Mai", giugno: "Juni", luglio: "Juli", agosto: "August", settembre: "September", ottobre: "Oktober", novembre: "November", dicembre: "Dezember" },
  en: { gennaio: "January", febbraio: "February", marzo: "March", aprile: "April", maggio: "May", giugno: "June", luglio: "July", agosto: "August", settembre: "September", ottobre: "October", novembre: "November", dicembre: "December" }
};

function routeLocale(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  if (!match || !CLIENT_PATHS.has(match[2])) return null;
  return { locale: match[1], basePath: match[2] };
}

function internalRequest(request, basePath) {
  const url = new URL(request.url);
  url.pathname = basePath;
  return new Request(url.toString(), request);
}

function translateText(value, locale) {
  let out = String(value || "");
  for (const [source, target] of COPY[locale]) out = out.split(source).join(target);
  return out;
}

function rewriteRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, "https://www.splendoria.vip"); } catch { return response; }
  if (target.pathname === "/studio" || target.pathname === "/account" || target.pathname === "/area-clienti") {
    target.pathname = `/${locale}${target.pathname}`;
  } else {
    return response;
  }
  for (const key of ["e", "m"]) {
    const value = target.searchParams.get(key);
    if (value) target.searchParams.set(key, translateText(value, locale));
  }
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function preserveGenreValues(html, locale) {
  let out = html;
  for (const [canonical, translated] of Object.entries(GENRES[locale])) {
    out = out.split(`<option>${canonical}</option>`).join(`<option value="${canonical}">${translated}</option>`);
    out = out.split(`>${canonical}</option>`).join(` value="${canonical}">${translated}</option>`);
    out = out.replace(new RegExp(`([>·\\s])${canonical}([<·\\s])`, "g"), `$1${translated}$2`);
  }
  return out;
}

function localizeMonths(html, locale) {
  let out = html;
  for (const [it, translated] of Object.entries(MONTHS[locale])) {
    out = out.replace(new RegExp(`\\b${it}\\b`, "gi"), translated);
  }
  return out;
}

function rewriteClientLinks(html, locale) {
  let out = html;
  for (const path of PUBLIC_AND_AUTH_PATHS) {
    out = out.split(`href="${path}"`).join(`href="/${locale}${path}"`);
  }
  for (const path of ["/studio", "/account", "/logout"]) {
    out = out.split(`href="${path}"`).join(`href="/${locale}${path}"`);
  }
  for (const path of ["/account/profilo", "/account/email", "/account/cancella"]) {
    out = out.split(`action="${path}"`).join(`action="/${locale}${path}"`);
  }
  out = out.split('href="/#').join(`href="/${locale}/#`);
  out = out.replace(/class="brand" href="\/"/, `class="brand" href="/${locale}/"`);
  return out;
}

function attachLocaleToScript(html, locale) {
  return html.replace(/src="\/assets\/studio\.js\?([^"#]*)"/i, (match, query) => {
    const params = new URLSearchParams(query || "");
    params.set("lang", locale);
    return `src="/assets/studio.js?${params.toString()}"`;
  });
}

function localizeHtml(html, locale) {
  let out = String(html || "").replace('<html lang="it">', `<html lang="${locale}">`);
  out = preserveGenreValues(out, locale);
  out = translateText(out, locale);
  out = localizeMonths(out, locale);
  out = rewriteClientLinks(out, locale);
  out = attachLocaleToScript(out, locale);
  return out;
}

function localizeClientScript(source, locale) {
  let out = String(source || "");
  const pairs = locale === "de" ? [
    ["Torna all’inizio della pagina", "Zum Seitenanfang"],
    ["Torna su", "Nach oben"],
    ["Mostra password", "Passwort anzeigen"],
    ["Nascondi password", "Passwort ausblenden"]
  ] : [
    ["Torna all’inizio della pagina", "Back to the top of the page"],
    ["Torna su", "Back to top"],
    ["Mostra password", "Show password"],
    ["Nascondi password", "Hide password"]
  ];
  for (const [sourceText, target] of pairs) out = out.split(sourceText).join(target);
  return out;
}

async function fetchClient(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/assets/studio.js") {
    const locale = url.searchParams.get("lang");
    const response = await authWorker.fetch(request, env, ctx);
    if (!COPY[locale] || !response.ok || !(response.headers.get("content-type") || "").includes("javascript")) return response;
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeClientScript(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
  }

  const route = routeLocale(url.pathname);
  if (!route) return authWorker.fetch(request, env, ctx);

  let response = await authWorker.fetch(internalRequest(request, route.basePath), env, ctx);
  response = rewriteRedirect(response, route.locale);
  if (request.method !== "GET" && request.method !== "POST") return response;
  if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", route.locale);
  headers.set("cache-control", "private, no-store");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return new Response(localizeHtml(await response.text(), route.locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchClient,
  email(message, env, ctx) { return authWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return authWorker.scheduled(controller, env, ctx); }
};
