import clientCopyWorker from "./i18n-editor-delete-worker.js";

const LOCALES = new Set(["de", "en"]);
const VERIFICATION_PATHS = new Set(["/verifica-email", "/reinvia-verifica-email"]);

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

function canonicalVerificationRoute(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  if (!match || !VERIFICATION_PATHS.has(match[2])) return null;
  return { locale: match[1], basePath: match[2] };
}

function localizeFallbackNames(value, locale) {
  let out = String(value || "");
  if (locale === "de") {
    out = out.replace(/^Ciao autore,/m, "Hallo,").replace(/^Ciao cliente,/m, "Hallo,");
  } else {
    out = out.replace(/^Ciao autore,/m, "Hello,").replace(/^Ciao cliente,/m, "Hello,");
  }
  return out;
}

function localizeEmailUrls(value, locale) {
  return String(value || "")
    .replace(/\/verifica-email\?/g, `/${locale}/verifica-email?`)
    .replace(/\/reimposta-password\?/g, `/${locale}/reimposta-password?`)
    .replace(/\/guida(?=(?:["'\s<]|$))/g, `/${locale}/guida`);
}

function localizeWelcomeEmail(message, locale) {
  const out = { ...message };
  out.subject = locale === "de"
    ? "Willkommen bei Splendoria · E-Mail-Adresse bestätigen"
    : "Welcome to Splendoria · verify your email address";

  let text = localizeEmailUrls(out.text, locale);
  text = localizeFallbackNames(text, locale);
  if (locale === "de") {
    text = text
      .replace(/^Ciao ([^\n]+),/m, "Hallo $1,")
      .replace(/benvenuto in Splendoria\. Verifica il tuo indirizzo entro (\d+) ore per attivare la Musa:/g, "willkommen bei Splendoria. Bestätige deine E-Mail-Adresse innerhalb von $1 Stunden, um die Muse zu aktivieren:")
      .replace(/Puoi già entrare nello Studio e raccogliere i ricordi\. La prova del primo progetto dura (\d+) giorni e comprende fino a (\d+) generazioni del primo capitolo\./g, "Du kannst dein Studio bereits öffnen und deine Erinnerungen sammeln. Die Testphase des ersten Projekts dauert $1 Tage und umfasst bis zu $2 Generierungen des ersten Kapitels.")
      .replace(/Guida completa:/g, "Vollständiger Leitfaden:")
      .replace(/Se non hai creato tu l’account, ignora questo messaggio\./g, "Falls du dieses Konto nicht erstellt hast, kannst du diese Nachricht ignorieren.");
  } else {
    text = text
      .replace(/^Ciao ([^\n]+),/m, "Hello $1,")
      .replace(/benvenuto in Splendoria\. Verifica il tuo indirizzo entro (\d+) ore per attivare la Musa:/g, "welcome to Splendoria. Verify your email address within $1 hours to activate the Muse:")
      .replace(/Puoi già entrare nello Studio e raccogliere i ricordi\. La prova del primo progetto dura (\d+) giorni e comprende fino a (\d+) generazioni del primo capitolo\./g, "You can already open your Studio and begin collecting your memories. The free trial for your first project lasts $1 days and includes up to $2 generations of the first chapter.")
      .replace(/Guida completa:/g, "Full guide:")
      .replace(/Se non hai creato tu l’account, ignora questo messaggio\./g, "If you did not create this account, you can ignore this message.");
  }
  out.text = text;

  let html = localizeEmailUrls(out.html, locale);
  if (locale === "de") {
    html = html
      .replace(/<p>Ciao autore,<\/p>/g, "<p>Hallo,</p>")
      .replace(/<p>Ciao cliente,<\/p>/g, "<p>Hallo,</p>")
      .replace(/<p>Ciao ([^<]+),<\/p>/g, "<p>Hallo $1,</p>")
      .replace(/<p>benvenuto in Splendoria\. Verifica il tuo indirizzo entro (\d+) ore per attivare la Musa\.<\/p>/g, "<p>Willkommen bei Splendoria. Bestätige deine E-Mail-Adresse innerhalb von $1 Stunden, um die Muse zu aktivieren.</p>")
      .replace(/>Verifica l’indirizzo email<\/a>/g, ">E-Mail-Adresse bestätigen</a>")
      .replace(/<p>Puoi già entrare nello Studio e raccogliere i ricordi\. La prova del primo progetto dura (\d+) giorni e comprende fino a (\d+) generazioni del primo capitolo\.<\/p>/g, "<p>Du kannst dein Studio bereits öffnen und deine Erinnerungen sammeln. Die Testphase des ersten Projekts dauert $1 Tage und umfasst bis zu $2 Generierungen des ersten Kapitels.</p>")
      .replace(/>Apri la guida completa allo Studio<\/a>/g, ">Vollständigen Studio-Leitfaden öffnen</a>")
      .replace(/<p>Se non hai creato tu l’account, ignora questo messaggio\.<\/p>/g, "<p>Falls du dieses Konto nicht erstellt hast, kannst du diese Nachricht ignorieren.</p>");
  } else {
    html = html
      .replace(/<p>Ciao autore,<\/p>/g, "<p>Hello,</p>")
      .replace(/<p>Ciao cliente,<\/p>/g, "<p>Hello,</p>")
      .replace(/<p>Ciao ([^<]+),<\/p>/g, "<p>Hello $1,</p>")
      .replace(/<p>benvenuto in Splendoria\. Verifica il tuo indirizzo entro (\d+) ore per attivare la Musa\.<\/p>/g, "<p>Welcome to Splendoria. Verify your email address within $1 hours to activate the Muse.</p>")
      .replace(/>Verifica l’indirizzo email<\/a>/g, ">Verify email address</a>")
      .replace(/<p>Puoi già entrare nello Studio e raccogliere i ricordi\. La prova del primo progetto dura (\d+) giorni e comprende fino a (\d+) generazioni del primo capitolo\.<\/p>/g, "<p>You can already open your Studio and begin collecting your memories. The free trial for your first project lasts $1 days and includes up to $2 generations of the first chapter.</p>")
      .replace(/>Apri la guida completa allo Studio<\/a>/g, ">Open the full Studio guide</a>")
      .replace(/<p>Se non hai creato tu l’account, ignora questo messaggio\.<\/p>/g, "<p>If you did not create this account, you can ignore this message.</p>");
  }
  out.html = html;
  return out;
}

function localizeResetEmail(message, locale) {
  const out = { ...message };
  out.subject = locale === "de" ? "Splendoria-Passwort zurücksetzen" : "Reset your Splendoria password";

  let text = localizeEmailUrls(out.text, locale);
  text = localizeFallbackNames(text, locale);
  if (locale === "de") {
    text = text
      .replace(/^Ciao ([^\n]+),/m, "Hallo $1,")
      .replace(/apri questo collegamento entro (\d+) minuti per scegliere una nuova password:/g, "öffne diesen Link innerhalb von $1 Minuten, um ein neues Passwort festzulegen:")
      .replace(/Se non hai richiesto tu il recupero, ignora questo messaggio\./g, "Falls du diese Passwortzurücksetzung nicht angefordert hast, kannst du diese Nachricht ignorieren.");
  } else {
    text = text
      .replace(/^Ciao ([^\n]+),/m, "Hello $1,")
      .replace(/apri questo collegamento entro (\d+) minuti per scegliere una nuova password:/g, "open this link within $1 minutes to choose a new password:")
      .replace(/Se non hai richiesto tu il recupero, ignora questo messaggio\./g, "If you did not request a password reset, you can ignore this message.");
  }
  out.text = text;

  let html = localizeEmailUrls(out.html, locale);
  if (locale === "de") {
    html = html
      .replace(/<p>Ciao cliente,<\/p>/g, "<p>Hallo,</p>")
      .replace(/<p>Ciao ([^<]+),<\/p>/g, "<p>Hallo $1,</p>")
      .replace(/<p>apri questo collegamento entro (\d+) minuti per scegliere una nuova password:<\/p>/g, "<p>Öffne diesen Link innerhalb von $1 Minuten, um ein neues Passwort festzulegen:</p>")
      .replace(/>Reimposta la password<\/a>/g, ">Passwort zurücksetzen</a>")
      .replace(/<p>Se non hai richiesto tu il recupero, ignora questo messaggio\.<\/p>/g, "<p>Falls du diese Passwortzurücksetzung nicht angefordert hast, kannst du diese Nachricht ignorieren.</p>");
  } else {
    html = html
      .replace(/<p>Ciao cliente,<\/p>/g, "<p>Hello,</p>")
      .replace(/<p>Ciao ([^<]+),<\/p>/g, "<p>Hello $1,</p>")
      .replace(/<p>apri questo collegamento entro (\d+) minuti per scegliere una nuova password:<\/p>/g, "<p>Open this link within $1 minutes to choose a new password:</p>")
      .replace(/>Reimposta la password<\/a>/g, ">Reset password</a>")
      .replace(/<p>Se non hai richiesto tu il recupero, ignora questo messaggio\.<\/p>/g, "<p>If you did not request a password reset, you can ignore this message.</p>");
  }
  out.html = html;
  return out;
}

export function localizeTransactionalEmail(message, locale) {
  if (!LOCALES.has(locale) || !message) return message;
  const subject = String(message.subject || "");
  if (subject === "Benvenuto in Splendoria · verifica il tuo indirizzo") return localizeWelcomeEmail(message, locale);
  if (subject === "Reimposta la password di Splendoria") return localizeResetEmail(message, locale);
  return message;
}

function localizedEnv(env, locale) {
  if (!LOCALES.has(locale) || !env?.CONTACT_EMAIL?.send) return env;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  const binding = env.CONTACT_EMAIL;
  wrapped.CONTACT_EMAIL = {
    send(message) {
      return binding.send(localizeTransactionalEmail(message, locale));
    }
  };
  return wrapped;
}

const PAGE_COPY = {
  de: [
    ["Email verificata", "E-Mail-Adresse bestätigt"],
    ["Verifica email", "E-Mail-Adresse bestätigen"],
    ["Email e sicurezza", "E-Mail und Sicherheit"],
    ["Indirizzo verificato", "E-Mail-Adresse bestätigt"],
    ["Verifica non riuscita", "Bestätigung fehlgeschlagen"],
    ["Il collegamento non è valido.", "Der Link ist ungültig."],
    ["Il collegamento è scaduto o è già stato utilizzato.", "Der Link ist abgelaufen oder wurde bereits verwendet."],
    ["Grazie: il tuo indirizzo email è stato verificato.", "Danke: Deine E-Mail-Adresse wurde bestätigt."],
    ["Ora puoi usare la Musa, creare l’indice e lavorare ai capitoli.", "Du kannst jetzt die Muse verwenden, die Gliederung erstellen und an deinen Kapiteln arbeiten."],
    ["Se il collegamento è scaduto, accedi allo Studio e richiedi una nuova email.", "Wenn der Link abgelaufen ist, melde dich in deinem Studio an und fordere eine neue E-Mail an."],
    ["Vai al mio Studio", "Zu meinem Studio"],
    ["Vai all’Area clienti", "Zum Kundenbereich"],
    ["Email inviata", "E-Mail gesendet"],
    ["Controlla la posta", "Posteingang prüfen"],
    ["Nuovo collegamento inviato", "Neuer Link gesendet"],
    ["Torna allo Studio", "Zurück zum Studio"],
    ["Hai richiesto troppe email. Attendi 15 minuti e riprova.", "Du hast zu viele E-Mails angefordert. Warte 15 Minuten und versuche es erneut."],
    ["Come funziona", "So funktioniert es"], ["Listino", "Preise"], ["Guida", "Leitfaden"], ["Contattaci", "Kontakt"],
    ["Il mio Studio", "Mein Studio"], ["Account", "Konto"], ["Esci", "Abmelden"],
    ["Guida allo Studio", "Studio-Leitfaden"], ["Termini e condizioni", "Allgemeine Geschäftsbedingungen"], ["Note legali", "Rechtliche Hinweise"], ["Trasparenza IA", "KI-Transparenz"]
  ],
  en: [
    ["Email verificata", "Email address verified"],
    ["Verifica email", "Verify email address"],
    ["Email e sicurezza", "Email and security"],
    ["Indirizzo verificato", "Email address verified"],
    ["Verifica non riuscita", "Verification failed"],
    ["Il collegamento non è valido.", "The link is invalid."],
    ["Il collegamento è scaduto o è già stato utilizzato.", "The link has expired or has already been used."],
    ["Grazie: il tuo indirizzo email è stato verificato.", "Thank you: your email address has been verified."],
    ["Ora puoi usare la Musa, creare l’indice e lavorare ai capitoli.", "You can now use the Muse, create the outline and work on your chapters."],
    ["Se il collegamento è scaduto, accedi allo Studio e richiedi una nuova email.", "If the link has expired, sign in to your Studio and request a new email."],
    ["Vai al mio Studio", "Go to my Studio"],
    ["Vai all’Area clienti", "Go to client area"],
    ["Email inviata", "Email sent"],
    ["Controlla la posta", "Check your inbox"],
    ["Nuovo collegamento inviato", "New link sent"],
    ["Torna allo Studio", "Back to Studio"],
    ["Hai richiesto troppe email. Attendi 15 minuti e riprova.", "You have requested too many emails. Wait 15 minutes and try again."],
    ["Come funziona", "How it works"], ["Listino", "Pricing"], ["Guida", "Guide"], ["Contattaci", "Contact"],
    ["Il mio Studio", "My Studio"], ["Account", "Account"], ["Esci", "Sign out"],
    ["Guida allo Studio", "Studio Guide"], ["Termini e condizioni", "Terms and conditions"], ["Note legali", "Legal notice"], ["Trasparenza IA", "AI transparency"]
  ]
};

function rewriteLocalizedLinks(html, locale) {
  let out = String(html || "");
  const paths = ["/studio", "/area-clienti", "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai", "/reinvia-verifica-email"];
  for (const path of paths) {
    out = out.split(`href="${path}"`).join(`href="/${locale}${path}"`);
    out = out.split(`action="${path}"`).join(`action="/${locale}${path}"`);
  }
  out = out.replace(/class="brand" href="\/"/, `class="brand" href="/${locale}/"`);
  return out;
}

function localizeVerificationHtml(html, locale) {
  let out = String(html || "").replace('<html lang="it">', `<html lang="${locale}">`);
  for (const [source, target] of PAGE_COPY[locale] || []) out = out.split(source).join(target);
  if (locale === "de") {
    out = out
      .replace(/Abbiamo inviato una nuova email di benvenuto e verifica a ([^<]+)\./g, "Wir haben eine neue Willkommens- und Bestätigungs-E-Mail an $1 gesendet.")
      .replace(/Il collegamento resta valido per (\d+) ore\. Controlla anche la cartella spam\./g, "Der Link ist $1 Stunden gültig. Prüfe auch deinen Spam-Ordner.")
      .replace(/Non siamo riusciti a consegnare il messaggio\. Riprova tra poco oppure scrivi a /g, "Die Nachricht konnte nicht zugestellt werden. Versuche es in Kürze erneut oder schreibe an ");
  } else {
    out = out
      .replace(/Abbiamo inviato una nuova email di benvenuto e verifica a ([^<]+)\./g, "We sent a new welcome and verification email to $1.")
      .replace(/Il collegamento resta valido per (\d+) ore\. Controlla anche la cartella spam\./g, "The link remains valid for $1 hours. Check your spam folder too.")
      .replace(/Non siamo riusciti a consegnare il messaggio\. Riprova tra poco oppure scrivi a /g, "We could not deliver the message. Try again shortly or write to ");
  }
  return rewriteLocalizedLinks(out, locale);
}

function rewriteRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, "https://www.splendoria.vip"); } catch { return response; }
  if (["/studio", "/area-clienti", "/verifica-email", "/reinvia-verifica-email"].includes(target.pathname)) target.pathname = `/${locale}${target.pathname}`;
  else return response;
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fetchEmailI18n(request, env, ctx) {
  const url = new URL(request.url);
  const locale = localeFromPath(url.pathname);
  const scopedEnv = localizedEnv(env, locale);
  const verificationRoute = canonicalVerificationRoute(url.pathname);

  let response;
  if (verificationRoute) {
    const internalUrl = new URL(request.url);
    internalUrl.pathname = verificationRoute.basePath;
    response = await clientCopyWorker.fetch(new Request(internalUrl.toString(), request), scopedEnv, ctx);
    response = rewriteRedirect(response, verificationRoute.locale);
  } else {
    response = await clientCopyWorker.fetch(request, scopedEnv, ctx);
  }

  if (!locale || request.method !== "GET" && request.method !== "POST" || response.status >= 300 && response.status < 400 || !(response.headers.get("content-type") || "").includes("text/html")) return response;

  let html = await response.text();
  if (verificationRoute) html = localizeVerificationHtml(html, locale);
  else html = rewriteLocalizedLinks(html, locale);

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", locale);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  fetch: fetchEmailI18n,
  email(message, env, ctx) { return clientCopyWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return clientCopyWorker.scheduled(controller, env, ctx); }
};
