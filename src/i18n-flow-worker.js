import commercialWorker from "./i18n-commercial-worker.js";

const ORIGIN = "https://www.splendoria.vip";

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

const MESSAGE_PAIRS = {
  de: [
    ["Accesso richiesto", "Anmeldung erforderlich"],
    ["Libro non disponibile", "Buch nicht verfügbar"],
    ["Capitolo non disponibile", "Kapitel nicht verfügbar"],
    ["Capitolo bloccato: attendi lo sblocco Pagato o Gratuito.", "Kapitel gesperrt: Warte auf die Freischaltung als Bezahlt oder Kostenlos."],
    ["Richiesta non valida", "Ungültige Anfrage"],
    ["Conferma prima la liceità dei contenuti e l’eventuale consenso ai dati particolari.", "Bestätige zuerst, dass du die Inhalte rechtmäßig verwenden darfst und gegebenenfalls in die Verarbeitung besonderer Daten einwilligst."],
    ["Il titolo è obbligatorio.", "Ein Titel ist erforderlich."],
    ["Questo capitolo è riservato al libro completo. Potrai aprirlo dopo che Splendoria avrà registrato lo stato Pagato o Gratuito.", "Dieses Kapitel ist dem vollständigen Buch vorbehalten. Du kannst es öffnen, sobald Splendoria den Status Bezahlt oder Kostenlos registriert hat."],
    ["Inserisci un titolo per il capitolo.", "Gib einen Titel für das Kapitel ein."],
    ["Scrivi prima qualche parola nel capitolo.", "Schreibe zuerst einige Wörter in das Kapitel."],
    ["Hai usato le tre generazioni gratuite disponibili per l’account. Scegli una formula per continuare.", "Du hast die drei kostenlosen Generierungen dieses Kontos aufgebraucht. Wähle ein Programm, um fortzufahren."],
    ["Per continuare devi accettare i Termini e condizioni.", "Um fortzufahren, musst du die Allgemeinen Geschäftsbedingungen akzeptieren."],
    ["Non c’è ancora una versione precedente da ripristinare.", "Es gibt noch keine vorherige Version, die wiederhergestellt werden kann."],
    ["Ultima versione del libro ripristinata. Puoi ripristinare di nuovo per tornare allo stato precedente.", "Die letzte Buchversion wurde wiederhergestellt. Du kannst erneut wiederherstellen, um zum vorherigen Stand zurückzukehren."],
    ["Richiesta di eliminazione non valida. Ricarica la pagina e riprova.", "Ungültige Löschanfrage. Lade die Seite neu und versuche es erneut."],
    ["Per confermare devi scrivere esattamente ELIMINA.", "Zur Bestätigung musst du genau ELIMINA eingeben."],
    ["La Musa sta completando un passaggio. Attendi la conclusione prima di eliminare il libro.", "Die Muse führt gerade einen Arbeitsschritt aus. Warte auf dessen Abschluss, bevor du das Buch löschst."],
    ["La Musa ha appena iniziato un passaggio. Attendi che termini prima di eliminare il libro.", "Die Muse hat gerade einen Arbeitsschritt begonnen. Warte, bis er abgeschlossen ist, bevor du das Buch löschst."],
    ["La password attuale non è corretta. Il libro non è stato eliminato.", "Das aktuelle Passwort ist nicht korrekt. Das Buch wurde nicht gelöscht."],
    ["Non è stato possibile eliminare il libro. Nessun contenuto è stato cancellato: riprova tra poco.", "Das Buch konnte nicht gelöscht werden. Es wurden keine Inhalte entfernt. Versuche es in Kürze erneut."],
    ["Verifica l’indirizzo email dal messaggio di benvenuto prima di usare la Musa. Puoi continuare a inserire e salvare i tuoi ricordi.", "Bestätige deine E-Mail-Adresse über die Willkommensnachricht, bevor du die Muse verwendest. Du kannst deine Erinnerungen weiterhin eingeben und speichern."],
    ["Verifica prima l’indirizzo email per usare la Musa.", "Bestätige zuerst deine E-Mail-Adresse, um die Muse zu verwenden."],
    ["La Musa non ha generato risposte sufficientemente fedeli. I testi inseriti sono stati salvati e sono rimasti intatti.", "Die Muse hat keine ausreichend verlässlichen Antworten erzeugt. Deine eingegebenen Texte wurden gespeichert und unverändert beibehalten."],
    ["La revisione non è stata applicata perché non ha superato il controllo di fedeltà o di grammatica. Il testo originale è rimasto intatto: riprova oppure modifica il passaggio direttamente.", "Die Überarbeitung wurde nicht übernommen, weil sie die Prüfung auf inhaltliche Treue oder Grammatik nicht bestanden hat. Der Originaltext blieb unverändert: Versuche es erneut oder bearbeite die Passage direkt."],
    ["Controllo grammaticale completato. Rileggi e conferma il testo prima della versione finale.", "Grammatikprüfung abgeschlossen. Lies den Text noch einmal und bestätige ihn vor der endgültigen Fassung."]
  ],
  en: [
    ["Accesso richiesto", "Sign-in required"],
    ["Libro non disponibile", "Book unavailable"],
    ["Capitolo non disponibile", "Chapter unavailable"],
    ["Capitolo bloccato: attendi lo sblocco Pagato o Gratuito.", "Chapter locked: wait until the book is unlocked as Paid or Free."],
    ["Richiesta non valida", "Invalid request"],
    ["Conferma prima la liceità dei contenuti e l’eventuale consenso ai dati particolari.", "First confirm that you may lawfully use the content and, where applicable, consent to the processing of special-category data."],
    ["Il titolo è obbligatorio.", "A title is required."],
    ["Questo capitolo è riservato al libro completo. Potrai aprirlo dopo che Splendoria avrà registrato lo stato Pagato o Gratuito.", "This chapter is reserved for the complete book. You can open it once Splendoria has recorded the book as Paid or Free."],
    ["Inserisci un titolo per il capitolo.", "Enter a title for the chapter."],
    ["Scrivi prima qualche parola nel capitolo.", "Write a few words in the chapter first."],
    ["Hai usato le tre generazioni gratuite disponibili per l’account. Scegli una formula per continuare.", "You have used the three free generations available for this account. Choose a programme to continue."],
    ["Per continuare devi accettare i Termini e condizioni.", "To continue, you must accept the Terms and conditions."],
    ["Non c’è ancora una versione precedente da ripristinare.", "There is no previous version to restore yet."],
    ["Ultima versione del libro ripristinata. Puoi ripristinare di nuovo per tornare allo stato precedente.", "The latest book version has been restored. You can restore again to return to the previous state."],
    ["Richiesta di eliminazione non valida. Ricarica la pagina e riprova.", "Invalid deletion request. Reload the page and try again."],
    ["Per confermare devi scrivere esattamente ELIMINA.", "To confirm, type ELIMINA exactly."],
    ["La Musa sta completando un passaggio. Attendi la conclusione prima di eliminare il libro.", "The Muse is completing a task. Wait for it to finish before deleting the book."],
    ["La Musa ha appena iniziato un passaggio. Attendi che termini prima di eliminare il libro.", "The Muse has just started a task. Wait for it to finish before deleting the book."],
    ["La password attuale non è corretta. Il libro non è stato eliminato.", "The current password is incorrect. The book was not deleted."],
    ["Non è stato possibile eliminare il libro. Nessun contenuto è stato cancellato: riprova tra poco.", "The book could not be deleted. No content was removed. Try again shortly."],
    ["Verifica l’indirizzo email dal messaggio di benvenuto prima di usare la Musa. Puoi continuare a inserire e salvare i tuoi ricordi.", "Verify your email address from the welcome message before using the Muse. You can continue entering and saving your memories."],
    ["Verifica prima l’indirizzo email per usare la Musa.", "Verify your email address before using the Muse."],
    ["La Musa non ha generato risposte sufficientemente fedeli. I testi inseriti sono stati salvati e sono rimasti intatti.", "The Muse did not generate sufficiently faithful answers. Your entered text was saved and left unchanged."],
    ["La revisione non è stata applicata perché non ha superato il controllo di fedeltà o di grammatica. Il testo originale è rimasto intatto: riprova oppure modifica il passaggio direttamente.", "The revision was not applied because it did not pass the fidelity or grammar check. The original text was left unchanged: try again or edit the passage directly."],
    ["Controllo grammaticale completato. Rileggi e conferma il testo prima della versione finale.", "Grammar check complete. Review and confirm the text before the final version."]
  ]
};

const STATE_PAIRS = {
  de: [
    ["Prova gratuita conclusa", "Kostenlose Testphase beendet"],
    ["La prova gratuita è terminata", "Die kostenlose Testphase ist beendet"],
    ["Crea gratuitamente il tuo primo capitolo", "Erstelle dein erstes Kapitel kostenlos"],
    ["Completa il libro", "Buch vervollständigen"],
    ["Libro completo", "Vollständiges Buch"],
    ["Accesso gratuito autorizzato", "Kostenloser Zugang freigeschaltet"],
    ["Pagamento confermato", "Zahlung bestätigt"],
    ["Tutti i capitoli e le funzionalità del libro sono sbloccati.", "Alle Kapitel und Funktionen des Buches sind freigeschaltet."],
    ["Il primo capitolo resta disponibile.", "Das erste Kapitel bleibt verfügbar."],
    ["Rimborsato", "Erstattet"],
    ["Bonifico in attesa di verifica", "Überweisung wird geprüft"],
    ["Formula scelta", "Ausgewähltes Programm"],
    ["Scrivi ELIMINA per confermare", "Tippe ELIMINA zur Bestätigung"],
    ["Mostra password", "Passwort anzeigen"],
    ["Verranno cancellati il progetto, i ricordi, l’intervista e tutti i capitoli di", "Gelöscht werden das Projekt, die Erinnerungen, das Interview und alle Kapitel von"],
    ["L’operazione non può essere annullata.", "Dieser Vorgang kann nicht rückgängig gemacht werden."],
    ["Gli eventuali ordini pagati o rimborsati restano conservati per gli obblighi amministrativi, ma non saranno più collegati al libro.", "Bereits bezahlte oder erstattete Bestellungen bleiben für administrative Pflichten erhalten, werden jedoch nicht mehr mit dem Buch verknüpft."]
  ],
  en: [
    ["Prova gratuita conclusa", "Free trial ended"],
    ["La prova gratuita è terminata", "The free trial has ended"],
    ["Crea gratuitamente il tuo primo capitolo", "Create your first chapter for free"],
    ["Completa il libro", "Complete the book"],
    ["Libro completo", "Complete book"],
    ["Accesso gratuito autorizzato", "Free access authorised"],
    ["Pagamento confermato", "Payment confirmed"],
    ["Tutti i capitoli e le funzionalità del libro sono sbloccati.", "All chapters and book features are unlocked."],
    ["Il primo capitolo resta disponibile.", "The first chapter remains available."],
    ["Rimborsato", "Refunded"],
    ["Bonifico in attesa di verifica", "Bank transfer awaiting verification"],
    ["Formula scelta", "Selected programme"],
    ["Scrivi ELIMINA per confermare", "Type ELIMINA to confirm"],
    ["Mostra password", "Show password"],
    ["Verranno cancellati il progetto, i ricordi, l’intervista e tutti i capitoli di", "The project, memories, interview and all chapters of"],
    ["L’operazione non può essere annullata.", "This cannot be undone."],
    ["Gli eventuali ordini pagati o rimborsati restano conservati per gli obblighi amministrativi, ma non saranno più collegati al libro.", "Any paid or refunded orders are retained for administrative obligations but will no longer be linked to the book."]
  ]
};

function translateMessage(value, locale) {
  let out = String(value || "");
  for (const [source, target] of MESSAGE_PAIRS[locale] || []) if (out === source) return target;
  const deleted = out.match(/^Libro “(.+)” eliminato definitivamente\.$/);
  if (deleted) return locale === "de" ? `Buch „${deleted[1]}“ endgültig gelöscht.` : `Book “${deleted[1]}” permanently deleted.`;
  return out;
}

function translateOperationalHtml(html, locale) {
  let out = String(html || "");
  for (const [source, target] of [...(MESSAGE_PAIRS[locale] || []), ...(STATE_PAIRS[locale] || [])]) out = out.split(source).join(target);
  out = out.replace(/Prova gratuita di (\d+) giorni/g, locale === "de" ? "Kostenlose Testphase von $1 Tagen" : "$1-day free trial");
  out = out.replace(/Puoi scrivere, dettare e affidare alla Musa il primo capitolo /g, locale === "de" ? "Du kannst das erste Kapitel schreiben, diktieren und der Muse anvertrauen " : "You can write, dictate and entrust the first chapter to the Muse ");
  out = out.replace(/Hai a disposizione fino a (\d+) generazioni gratuite complessive\./g, locale === "de" ? "Dir stehen insgesamt bis zu $1 kostenlose Generierungen zur Verfügung." : "You have up to $1 free generations in total.");
  out = out.replace(/Gli altri capitoli restano bloccati fino allo sblocco amministrativo “Pagato” o “Gratuito”\./g, locale === "de" ? "Die weiteren Kapitel bleiben gesperrt, bis sie administrativ als „Bezahlt“ oder „Kostenlos“ freigeschaltet werden." : "The remaining chapters stay locked until they are administratively unlocked as “Paid” or “Free”.");
  out = out.replace(/La prova gratuita si è conclusa /g, locale === "de" ? "Die kostenlose Testphase endete " : "The free trial ended ");
  out = out.replace(/I contenuti restano custoditi, ma per modificarli o usare la Musa devi scegliere una formula e attendere lo sblocco manuale\./g, locale === "de" ? "Deine Inhalte bleiben gespeichert; um sie zu bearbeiten oder die Muse zu verwenden, wähle ein Programm und warte auf die manuelle Freischaltung." : "Your content remains stored; to edit it or use the Muse, choose a programme and wait for manual unlocking.");
  return out;
}

function localizedHeaders(response, locale) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", locale);
  if ((headers.get("content-type") || "").includes("text/html") || (headers.get("content-type") || "").includes("application/json")) {
    headers.set("cache-control", "private, no-store, max-age=0");
  }
  return headers;
}

function localizeRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, ORIGIN); } catch { return response; }
  const message = target.searchParams.get("e");
  if (message) target.searchParams.set("e", translateMessage(message, locale));
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  headers.set("content-language", locale);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function localizeJson(response, locale) {
  let data;
  try { data = await response.clone().json(); } catch { return response; }
  if (data && typeof data.error === "string") data.error = translateMessage(data.error, locale);
  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers: localizedHeaders(response, locale)
  });
}

function firstKnownNotice(html, locale) {
  for (const [source] of MESSAGE_PAIRS[locale] || []) if (html.includes(source)) return translateMessage(source, locale);
  return "";
}

function injectNotice(html, notice, locale) {
  if (!notice) return html;
  const safe = notice.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const block = `<p class="error flow-notice" role="alert" tabindex="-1">${safe}</p>`;
  if (html.includes('<div class="journey">')) return html.replace('<div class="journey">', `${block}<div class="journey">`);
  if (html.includes('<div class="writing-shell">')) return html.replace('<div class="writing-shell">', `${block}<div class="writing-shell">`);
  return html.replace("</main>", `${block}</main>`);
}

async function normalizePostHtml(request, response, locale, env, ctx) {
  const type = response.headers.get("content-type") || "";
  if (request.method === "GET" || !type.includes("text/html") || !response.ok) return response;
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/(de|en)\/libro\/([^/]+)/);
  if (!match) return response;
  const originalHtml = await response.text();
  const notice = firstKnownNotice(originalHtml, locale);
  if (!notice) return new Response(translateOperationalHtml(originalHtml, locale), {
    status: response.status,
    statusText: response.statusText,
    headers: localizedHeaders(response, locale)
  });
  const editorUrl = new URL(request.url);
  editorUrl.pathname = `/${locale}/libro/${match[2]}`;
  editorUrl.search = "";
  const editorRequest = new Request(editorUrl.toString(), { method: "GET", headers: request.headers });
  const editorResponse = await commercialWorker.fetch(editorRequest, env, ctx);
  if (!editorResponse.ok || !(editorResponse.headers.get("content-type") || "").includes("text/html")) {
    return new Response(translateOperationalHtml(originalHtml, locale), {
      status: response.status,
      statusText: response.statusText,
      headers: localizedHeaders(response, locale)
    });
  }
  let html = translateOperationalHtml(await editorResponse.text(), locale);
  html = injectNotice(html, notice, locale);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: localizedHeaders(editorResponse, locale)
  });
}

async function fetchFlow(request, env, ctx) {
  let response = await commercialWorker.fetch(request, env, ctx);
  const locale = localeFromPath(new URL(request.url).pathname);
  if (!locale) return response;
  response = localizeRedirect(response, locale);
  if (response.status >= 300 && response.status < 400) return response;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return localizeJson(response, locale);
  if (type.includes("text/html")) {
    response = await normalizePostHtml(request, response, locale, env, ctx);
    if ((response.headers.get("content-type") || "").includes("text/html")) {
      return new Response(translateOperationalHtml(await response.text(), locale), {
        status: response.status,
        statusText: response.statusText,
        headers: localizedHeaders(response, locale)
      });
    }
  }
  return response;
}

export default {
  fetch: fetchFlow,
  email(message, env, ctx) { return commercialWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return commercialWorker.scheduled(controller, env, ctx); }
};
