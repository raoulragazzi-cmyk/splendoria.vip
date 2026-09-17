import publicWorker from "./i18n-entry-worker.js";

const CUSTOMER_AUTH_PATHS = new Set([
  "/registrati",
  "/area-clienti",
  "/password-dimenticata",
  "/reimposta-password"
]);

const COPY = {
  de: [
    ["Password aggiornata. Ora puoi accedere.", "Passwort aktualisiert. Du kannst dich jetzt anmelden."],
    ["Troppe registrazioni o tentativi da questa connessione. Attendi 15 minuti e riprova.", "Zu viele Registrierungen oder Versuche über diese Verbindung. Warte 15 Minuten und versuche es erneut."],
    ["Questo è un account amministratore. Utilizza l’Area amministratore.", "Dies ist ein Administratorkonto. Verwende den Administratorbereich."],
    ["Troppi tentativi. Attendi 15 minuti e riprova.", "Zu viele Versuche. Warte 15 Minuten und versuche es erneut."],
    ["Esiste già un account con questa email. Accedi dall’Area clienti.", "Für diese E-Mail-Adresse besteht bereits ein Konto. Melde dich im Kundenbereich an."],
    ["Per creare lo Studio devi prendere visione della Privacy Policy.", "Um dein Studio zu erstellen, musst du die Datenschutzerklärung zur Kenntnis nehmen."],
    ["Le due password non coincidono. Controllale e riprova.", "Die beiden Passwörter stimmen nicht überein. Prüfe sie und versuche es erneut."],
    ["La password deve contenere almeno 10 caratteri.", "Das Passwort muss mindestens 10 Zeichen enthalten."],
    ["Inserisci un indirizzo email valido.", "Gib eine gültige E-Mail-Adresse ein."],
    ["Inserisci il tuo nome.", "Gib deinen Namen ein."],
    ["Email o password non corretti.", "E-Mail-Adresse oder Passwort sind nicht korrekt."],
    ["Il collegamento o la password non sono validi.", "Der Link oder das Passwort ist ungültig."],
    ["Il collegamento è scaduto o è già stato utilizzato.", "Der Link ist abgelaufen oder wurde bereits verwendet."],
    ["Le due password non coincidono.", "Die beiden Passwörter stimmen nicht überein."],
    ["Crea il tuo Studio", "Erstelle dein Studio"],
    ["Inizia gratuitamente e trasforma la tua storia in un libro.", "Starte kostenlos und verwandle deine Geschichte in ein Buch."],
    ["Hai già un account?", "Du hast bereits ein Konto?"],
    ["Registrati gratis", "Kostenlos registrieren"],
    ["Conferma password", "Passwort bestätigen"],
    ["Usa almeno 10 caratteri. Le due password devono coincidere.", "Verwende mindestens 10 Zeichen. Beide Passwörter müssen übereinstimmen."],
    ["Mostra le password", "Passwörter anzeigen"],
    ["Mostra password", "Passwort anzeigen"],
    ["Ho letto la ", "Ich habe die "],
    [" e comprendo il trattamento dei dati necessario a creare e utilizzare lo Studio.", " gelesen und verstehe die Datenverarbeitung, die zur Erstellung und Nutzung des Studios erforderlich ist."],
    ["Accedi al tuo Studio", "Melde dich in deinem Studio an"],
    ["Continua a creare, rivedere e custodire il tuo libro.", "Arbeite weiter an deinem Buch, überarbeite es und bewahre es sicher auf."],
    ["Entra nel tuo Studio", "Mein Studio öffnen"],
    ["Password dimenticata?", "Passwort vergessen?"],
    ["Non hai un account?", "Du hast noch kein Konto?"],
    ["Area clienti", "Kundenbereich"],
    ["Registrati", "Registrieren"],
    ["Nome", "Name"],
    ["Recupero accesso", "Zugang wiederherstellen"],
    ["Inserisci l’email usata per Splendoria.", "Gib die E-Mail-Adresse ein, die du für Splendoria verwendest."],
    ["Invia il collegamento", "Link senden"],
    ["Se l’indirizzo è registrato, riceverai un collegamento valido per 30 minuti. Controlla anche la cartella spam.", "Wenn die Adresse registriert ist, erhältst du einen Link, der 30 Minuten gültig ist. Prüfe auch den Spam-Ordner."],
    ["Se non arriva entro cinque minuti, scrivi a ", "Wenn die Nachricht nicht innerhalb von fünf Minuten ankommt, schreibe an "],
    ["← Torna alla scelta dell’area", "← Zurück zum Kundenbereich"],
    ["Scegli una nuova password", "Wähle ein neues Passwort"],
    ["Nuova password", "Neues Passwort"],
    ["Reimposta l'accesso", "Zugang zurücksetzen"],
    ["Conferma nuova password", "Neues Passwort bestätigen"],
    ["Salva la nuova password", "Neues Passwort speichern"],
    ["← Scegli un’altra area", "← Zurück zur Startseite"],
    ["Come funziona", "So funktioniert es"],
    ["Listino", "Preise"],
    ["Guida allo Studio", "Studio-Leitfaden"],
    ["La tua vita in un romanzo", "Dein Leben als Roman"],
    ['aria-label="Informazioni e assistenza"', 'aria-label="Informationen und Unterstützung"'],
    ["Guida", "Leitfaden"],
    ["Contattaci", "Kontakt"],
    ["Il mio Studio", "Mein Studio"],
    ["Termini e condizioni", "Allgemeine Geschäftsbedingungen"],
    ["Note legali", "Rechtliche Hinweise"],
    ["Trasparenza IA", "KI-Transparenz"],
    ["Le due password non coincidono.", "Die beiden Passwörter stimmen nicht überein."]
  ],
  en: [
    ["Password aggiornata. Ora puoi accedere.", "Password updated. You can now sign in."],
    ["Troppe registrazioni o tentativi da questa connessione. Attendi 15 minuti e riprova.", "Too many registrations or attempts from this connection. Wait 15 minutes and try again."],
    ["Questo è un account amministratore. Utilizza l’Area amministratore.", "This is an administrator account. Use the administrator area."],
    ["Troppi tentativi. Attendi 15 minuti e riprova.", "Too many attempts. Wait 15 minutes and try again."],
    ["Esiste già un account con questa email. Accedi dall’Area clienti.", "An account already exists for this email address. Sign in from the client area."],
    ["Per creare lo Studio devi prendere visione della Privacy Policy.", "To create your Studio, you must review the Privacy Policy."],
    ["Le due password non coincidono. Controllale e riprova.", "The two passwords do not match. Check them and try again."],
    ["La password deve contenere almeno 10 caratteri.", "The password must contain at least 10 characters."],
    ["Inserisci un indirizzo email valido.", "Enter a valid email address."],
    ["Inserisci il tuo nome.", "Enter your name."],
    ["Email o password non corretti.", "Email address or password is incorrect."],
    ["Il collegamento o la password non sono validi.", "The link or password is invalid."],
    ["Il collegamento è scaduto o è già stato utilizzato.", "The link has expired or has already been used."],
    ["Le due password non coincidono.", "The two passwords do not match."],
    ["Crea il tuo Studio", "Create your Studio"],
    ["Inizia gratuitamente e trasforma la tua storia in un libro.", "Start for free and turn your story into a book."],
    ["Hai già un account?", "Already have an account?"],
    ["Registrati gratis", "Register for free"],
    ["Conferma password", "Confirm password"],
    ["Usa almeno 10 caratteri. Le due password devono coincidere.", "Use at least 10 characters. Both passwords must match."],
    ["Mostra le password", "Show passwords"],
    ["Mostra password", "Show password"],
    ["Ho letto la ", "I have read the "],
    [" e comprendo il trattamento dei dati necessario a creare e utilizzare lo Studio.", " and understand the data processing required to create and use the Studio."],
    ["Accedi al tuo Studio", "Sign in to your Studio"],
    ["Continua a creare, rivedere e custodire il tuo libro.", "Continue creating, revising and safeguarding your book."],
    ["Entra nel tuo Studio", "Open my Studio"],
    ["Password dimenticata?", "Forgot your password?"],
    ["Non hai un account?", "Don't have an account?"],
    ["Area clienti", "Client area"],
    ["Registrati", "Register"],
    ["Nome", "Name"],
    ["Recupero accesso", "Account recovery"],
    ["Inserisci l’email usata per Splendoria.", "Enter the email address you use for Splendoria."],
    ["Invia il collegamento", "Send the link"],
    ["Se l’indirizzo è registrato, riceverai un collegamento valido per 30 minuti. Controlla anche la cartella spam.", "If the address is registered, you will receive a link valid for 30 minutes. Check your spam folder too."],
    ["Se non arriva entro cinque minuti, scrivi a ", "If it does not arrive within five minutes, write to "],
    ["← Torna alla scelta dell’area", "← Back to the client area"],
    ["Scegli una nuova password", "Choose a new password"],
    ["Nuova password", "New password"],
    ["Reimposta l'accesso", "Reset access"],
    ["Conferma nuova password", "Confirm new password"],
    ["Salva la nuova password", "Save new password"],
    ["← Scegli un’altra area", "← Back to the home page"],
    ["Come funziona", "How it works"],
    ["Listino", "Pricing"],
    ["Guida", "Guide"],
    ["Contattaci", "Contact"],
    ["Il mio Studio", "My Studio"],
    ["Termini e condizioni", "Terms and conditions"],
    ["Note legali", "Legal notice"],
    ["Trasparenza IA", "AI transparency"],
    ["Le due password non coincidono.", "The two passwords do not match."]
  ]
};

function authRoute(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  if (!match || !CUSTOMER_AUTH_PATHS.has(match[2])) return null;
  return { locale: match[1], basePath: match[2] };
}

function localPath(locale, basePath) {
  return `/${locale}${basePath}`;
}

function rewriteCustomerLinks(html, locale) {
  let out = html;
  for (const path of CUSTOMER_AUTH_PATHS) {
    out = out.split(`href="${path}"`).join(`href="${localPath(locale, path)}"`);
    out = out.split(`action="${path}"`).join(`action="${localPath(locale, path)}"`);
  }
  out = out.split('href="/accedi"').join(`href="/${locale}/area-clienti"`);
  out = out.split('href="/privacy-policy"').join(`href="/${locale}/privacy-policy"`);
  out = out.split('href="/cookie-policy"').join(`href="/${locale}/cookie-policy"`);
  out = out.split('href="/termini-condizioni"').join(`href="/${locale}/termini-condizioni"`);
  out = out.split('href="/note-legali"').join(`href="/${locale}/note-legali"`);
  out = out.split('href="/trasparenza-ai"').join(`href="/${locale}/trasparenza-ai"`);
  out = out.split('href="/guida"').join(`href="/${locale}/guida"`);
  out = out.split('href="/#').join(`href="/${locale}/#`);
  out = out.replace(/class="brand" href="\/"/, `class="brand" href="/${locale}/"`);
  return out;
}

function localizeAuthHtml(html, locale) {
  let out = String(html || "");
  out = out.replace('<html lang="it">', `<html lang="${locale}">`);
  for (const [source, target] of COPY[locale]) out = out.split(source).join(target);
  out = rewriteCustomerLinks(out, locale);
  if (locale === "de") {
    out = out.split("Registrati — Splendoria").join("Registrieren — Splendoria");
    out = out.split("Area clienti — Splendoria").join("Kundenbereich — Splendoria");
    out = out.split("Password dimenticata — Splendoria").join("Passwort vergessen — Splendoria");
    out = out.split("Scegli una nuova password — Splendoria").join("Neues Passwort wählen — Splendoria");
  } else {
    out = out.split("Registrati — Splendoria").join("Register — Splendoria");
    out = out.split("Area clienti — Splendoria").join("Client area — Splendoria");
    out = out.split("Password dimenticata — Splendoria").join("Forgot password — Splendoria");
    out = out.split("Scegli una nuova password — Splendoria").join("Choose a new password — Splendoria");
  }
  return out;
}

function rewriteCustomerRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, "https://www.splendoria.vip"); } catch { return response; }
  if (CUSTOMER_AUTH_PATHS.has(target.pathname)) target.pathname = localPath(locale, target.pathname);
  else if (target.pathname === "/accedi") target.pathname = `/${locale}/area-clienti`;
  else return response;
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isLocalizedPublic(pathname) {
  return /^\/(de|en)(?:\/|$)/.test(pathname);
}

async function fetchAuth(request, env, ctx) {
  const url = new URL(request.url);
  const route = authRoute(url.pathname);

  if (!route) {
    const response = await publicWorker.fetch(request, env, ctx);
    if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html") || !isLocalizedPublic(url.pathname)) return response;
    const locale = url.pathname.startsWith("/de") ? "de" : "en";
    const html = rewriteCustomerLinks(await response.text(), locale);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }

  const internalUrl = new URL(request.url);
  internalUrl.pathname = route.basePath;
  const internalRequest = new Request(internalUrl.toString(), request);
  let response = await publicWorker.fetch(internalRequest, env, ctx);
  response = rewriteCustomerRedirect(response, route.locale);

  if (!(response.headers.get("content-type") || "").includes("text/html") || response.status >= 300 && response.status < 400) return response;
  const html = localizeAuthHtml(await response.text(), route.locale);
  const headers = new Headers(response.headers);
  headers.set("content-language", route.locale);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  fetch: fetchAuth,
  email(message, env, ctx) { return publicWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return publicWorker.scheduled(controller, env, ctx); }
};
