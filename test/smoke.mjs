import worker from "../src/worker.js";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const DB = {
  prepare() {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async first() { return null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};

const env = {
  DB,
  APP_URL: "https://www.splendoria.vip",
  ADMIN_EMAIL: "raoulragazzi@gmail.com",
  EMAIL_FROM: "contatti@splendoria.vip",
  AI: { async run() { return { response: "Le radici\nLa svolta\nIl futuro\nEpilogo" }; } }
};

for (const path of ["/", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai", "/accedi", "/area-clienti", "/area-amministratore", "/registrati", "/password-dimenticata", "/studio", "/admin", "/pagina-che-non-esiste"]) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  if (![200, 303, 404].includes(response.status)) throw new Error(`${path}: stato ${response.status}`);
  if (response.status === 200 && !(await response.text()).includes("Splendoria")) throw new Error(`${path}: HTML non valido`);
  console.log(`${path}: ${response.status}`);
}

const canonicalResponse = await worker.fetch(new Request("https://splendoria.vip/area-clienti?da=apice"), env);
if (canonicalResponse.status !== 308 || canonicalResponse.headers.get("location") !== "https://www.splendoria.vip/area-clienti?da=apice") throw new Error("Dominio: reindirizzamento canonico verso www non valido");
console.log("/dominio: host canonico www applicato");

const accessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env)).text();
if (!accessHtml.includes('href="/area-clienti"') || !accessHtml.includes('href="/area-amministratore"') || !accessHtml.includes("Scegli la tua area")) throw new Error("Accesso: scelta tra area clienti e amministratore incompleta");
const clientAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env)).text();
if (!clientAccessHtml.includes('action="/area-clienti"') || !clientAccessHtml.includes("Accedi al tuo Studio") || /name="password"[^>]*minlength/.test(clientAccessHtml)) throw new Error("Accesso clienti: schermata o compatibilità password storiche non valida");
const adminAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env)).text();
if (!adminAccessHtml.includes('action="/area-amministratore"') || !adminAccessHtml.includes("sblocco dei pagamenti")) throw new Error("Accesso amministratore: schermata non valida");
console.log("/accesso: schermate cliente e amministratore separate");

const showcaseTypography = await (await worker.fetch(new Request("https://www.splendoria.vip/"), env)).text();
if (!showcaseTypography.includes('class="showcase-page legacy-showcase"') || !showcaseTypography.includes('--font-editorial:"Gentium Book Plus"') || !showcaseTypography.includes("--font-ui:Inter") || !showcaseTypography.includes("--imperial:#004225") || !showcaseTypography.includes("--satin-gold:#c5a059") || !showcaseTypography.includes("--night:#1a1b26")) throw new Error("Vetrina: identità editoriale e palette non applicate");
if (!showcaseTypography.includes("legacy-hero-grid") || !showcaseTypography.includes('src="/assets/splendoria-book-hero.webp"') || !showcaseTypography.includes("La tua vita in un romanzo") || !showcaseTypography.includes("La tua storia destinata a vivere centinaia di anni") || !showcaseTypography.includes("Inizia il tuo libro")) throw new Error("Vetrina: nuova Hero editoriale incompleta");
if (!showcaseTypography.includes('src="/assets/studio.js?v=20260810-3"')) throw new Error("Vetrina: asset JavaScript non versionato contro la cache del browser");
const publicNavigation = showcaseTypography.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (["Come funziona", "Listino", "Contattaci", "Il mio Studio"].some(label => !publicNavigation.includes(label)) || !publicNavigation.includes('href="/#metodo"') || !publicNavigation.includes('href="/#formule"') || !publicNavigation.includes('href="/#contatti"') || publicNavigation.includes("Area amministratore")) throw new Error("Navigazione: menu completo della vetrina assente, destinazioni errate o collegamento amministratore esposto");
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/gentium-book-plus-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`Vetrina: font locale ${weight} non valido`);
}
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/eb-garamond-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`PDF: Garamond locale ${weight} non valido`);
}
const heroImage = readFileSync(new URL("../public/assets/splendoria-book-hero.webp", import.meta.url));
if (heroImage.byteLength < 40000 || heroImage.subarray(0, 4).toString() !== "RIFF" || heroImage.subarray(8, 12).toString() !== "WEBP") throw new Error("Vetrina: immagine Hero WebP non valida");
const showcaseSections = [...showcaseTypography.matchAll(/data-showcase-section="([^"]+)"/g)].map(match => match[1]);
const requiredSections = ["hero", "advantages", "comparison", "paths", "method", "markets", "governance", "assessment", "faq", "final-cta"];
if (requiredSections.some(section => !showcaseSections.includes(section)) || new Set(showcaseSections).size !== 10) throw new Error("Vetrina: architettura in dieci sezioni incompleta");
if (!showcaseTypography.includes('data-legacy-slider') || (showcaseTypography.match(/data-legacy-range/g) || []).length !== 2 || !showcaseTypography.includes("Sposta il cursore") || !showcaseTypography.includes("legacy-hint-arrow-left") || !showcaseTypography.includes("legacy-hint-arrow-right") || !showcaseTypography.includes("La stanza della domenica") || !showcaseTypography.includes("L’Opera Splendoria") || !showcaseTypography.includes("Mia nonna sembrava conoscere una geometria segreta")) throw new Error("Vetrina: doppio cursore o trasmutazione letteraria interattiva incompleti");
if (!showcaseTypography.includes("Aumento uniforme di 2 px") || !showcaseTypography.includes("legacy-credentials dt,.legacy-sheet-grid dt{font-size:12px") || !showcaseTypography.includes("legacy-comparison-table td,.legacy-control-list p,.legacy-sheet-grid dd,.legacy-faq-list details p{font-size:17px")) throw new Error("Vetrina: aumento dei corpi minuti non applicato in modo uniforme");
if (!showcaseTypography.includes('data-editorial-assessment') || !showcaseTypography.includes("Dimensione della trama del libro") || !showcaseTypography.includes("Nodi cruciali") || !showcaseTypography.includes("Estrazione Muse") || !showcaseTypography.includes("Scheda Tecnica del Progetto Editoriale") || !showcaseTypography.includes("Stampa o salva in PDF")) throw new Error("Vetrina: Assessment Editoriale o Scheda Tecnica incompleti");
if (!showcaseTypography.includes("Le Muse ti guidano") || !showcaseTypography.includes("Quattro livelli di controllo") || !showcaseTypography.includes("I tuoi racconti rimangono segreti")) throw new Error("Vetrina: guida delle Muse o livelli di controllo incompleti");
if (["Casa editoriale della memoria", "Una storia destinata a restare", "Inizia il tuo Retaggio", "Governance operativa 7Agent", "“7Agent” identifica", "Protezione del dato", "Splendoria o il precipizio del testo indistinto", "La memoria non chiede di essere celebrata"].some(text => showcaseTypography.includes(text))) throw new Error("Vetrina: una o più formulazioni precedenti sono ancora pubblicate");
if (!showcaseTypography.includes("Dati custoditi nell’infrastruttura Splendoria") || !showcaseTypography.includes("Progetto conservato su Splendoria D1 con accessi separati") || !showcaseTypography.includes("Account, progetti, capitoli e interviste sono conservati nell’infrastruttura Splendoria") || !showcaseTypography.includes("La bellezza di poter finalmente trasmettere una visione")) throw new Error("Vetrina: riferimenti a Splendoria o chiusura finale incompleti");
if (!showcaseTypography.includes("La forza della tradizione") || !showcaseTypography.includes("gesti, fallimenti, errori e visioni") || !showcaseTypography.includes("Tre possibilità, una grande cura editoriale") || !showcaseTypography.includes("Fino a 80 pagine") || !showcaseTypography.includes("Fino a 120 pagine") || !showcaseTypography.includes("La prima architettura del tuo libro")) throw new Error("Vetrina: copy editoriale o pagine dei percorsi non aggiornati");
if (showcaseTypography.includes("Vai al contenuto") || showcaseTypography.includes('class="skip-link"') || showcaseTypography.includes("Retaggio") || showcaseTypography.includes("Fino a 100 pagine") || showcaseTypography.includes("Fino a 250 pagine") || showcaseTypography.includes("Non un preventivo")) throw new Error("Vetrina: copy precedente o collegamento al contenuto ancora presente");
if (showcaseTypography.includes("Retaggio Editoriale Certificato") || showcaseTypography.includes("scritta dai maestri") || showcaseTypography.includes("ROI Storico")) throw new Error("Vetrina: promessa commerciale non dimostrabile ancora pubblicata");
console.log("/vetrina: dieci sezioni, Hero, slider, governance e Assessment disponibili");

const wranglerConfig = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
if (!wranglerConfig.includes('"database_name": "splendoria-db"') || !wranglerConfig.includes('"database_id": "1a46b8b0-2e6f-44cf-a22f-4950259f9434"') || !wranglerConfig.includes('"APP_URL": "https://www.splendoria.vip"') || !wranglerConfig.includes('"directory": "./public"') || !wranglerConfig.includes('"name": "ADMIN_EMAIL_NOTIFICATION"') || !wranglerConfig.includes('"destination_address": "raoulragazzi@gmail.com"') || !wranglerConfig.includes('"crons": ["*/5 * * * *"]')) throw new Error("Cloudflare: configurazione di produzione, email o asset statici non valida");
if (wranglerConfig.includes('"database_name": "splendoria-v2-test"') || wranglerConfig.includes("splendoria-v2.raoulragazzi.workers.dev")) throw new Error("Cloudflare: riferimenti all’ambiente di test ancora attivi");
console.log("/configurazione: database e URL di produzione attivi");

const workerSource = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
for (const table of ["User", "BookProject", "BookChapter", "BookInterview", "Session", "RegistrationNotification"]) {
  if (!workerSource.includes(`INSERT INTO "${table}"`)) throw new Error(`Cloudflare D1: scrittura persistente ${table} non trovata`);
}
if (!schemaSource.includes('CREATE TABLE IF NOT EXISTS "RegistrationNotification"') || !workerSource.includes("retryRegistrationNotifications") || !workerSource.includes("async scheduled")) throw new Error("Registrazione: tracciamento D1 o ritento automatico della notifica incompleto");
if (!schemaSource.includes('"sourceMaterial" TEXT NOT NULL DEFAULT') || !workerSource.includes('ensureColumn(db,"BookProject","sourceMaterial"') || !workerSource.includes("hasRepeatedPassages") || !workerSource.includes("reviewMuseDraft")) throw new Error("Muse: fonti aggiuntive, migrazione D1 o controllo qualità automatico incompleti");
const localStorageKeys = [...workerSource.matchAll(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)/g)].map(match => match[1]);
const unexpectedLocalStorage = localStorageKeys.filter(key => !["splendoria-cookie-notice-v1", "splendoria-voice-language"].includes(key));
if (unexpectedLocalStorage.length || !workerSource.includes("HttpOnly; Secure; SameSite=Lax")) throw new Error("Persistenza: dati utente o libro esposti nel dispositivo locale");
console.log("/persistenza: utenti, libri, capitoli, interviste e sessioni su Cloudflare D1; in locale solo preferenze tecniche");

const pricingResponse = await worker.fetch(new Request("https://www.splendoria.vip/?formula=complete"), env);
const pricingHtml = await pricingResponse.text();
if (!pricingHtml.includes("Digital") || !pricingHtml.includes("Premium") || !pricingHtml.includes("Signature")) throw new Error("Listino: formule mancanti");
if (!pricingHtml.includes("1.000 €") || !pricingHtml.includes("1.500 €") || !pricingHtml.includes("2.500 €") || !pricingHtml.includes("10 copie cartacee")) throw new Error("Listino: prezzi o contenuti principali non validi");
if (!pricingHtml.includes("Possibile accompagnamento Scuola Holden, da concordare e soggetto a disponibilità") || !pricingHtml.includes("non è automatico né incluso senza accordo scritto")) throw new Error("Listino: precisazione Scuola Holden incompleta");
if (!pricingHtml.includes('<option value="complete" selected>Splendoria Premium · 1.500 €</option>')) throw new Error("Listino: formula Premium non riportata nel configuratore");
if (pricingHtml.includes("Hybrid") || pricingHtml.includes("Premium Short Book") || pricingHtml.includes("Personal Branding &amp; Corporate")) throw new Error("Listino: denominazioni precedenti ancora presenti");
if (pricingHtml.includes("prime 5 copie") || pricingHtml.includes("consegna entro 10 giorni")) throw new Error("Listino: promesse della precedente offerta ancora presenti");
if (!pricingHtml.includes("Partita IVA 02950290219") || !pricingHtml.includes('href="/privacy-policy"') || !pricingHtml.includes('href="/cookie-policy"')) throw new Error("Informazioni legali: P.IVA o collegamenti del footer mancanti");
if (pricingHtml.includes("Merano") || pricingHtml.includes("Via J. W. von Goethe")) throw new Error("Informazioni legali: vecchio indirizzo ancora presente");
if (!pricingHtml.includes("Via Settala 22–24, Milano (MI)")) throw new Error("Informazioni legali: indirizzo di Milano mancante");
if (!pricingHtml.includes('name="privacyRead"') || !pricingHtml.includes("Ho letto la")) throw new Error("Contatti: presa visione della Privacy Policy mancante");
if (!pricingHtml.includes('data-cookie-banner') || !pricingHtml.includes("Ho capito e continuo") || !pricingHtml.includes("Non utilizziamo cookie pubblicitari o di profilazione")) throw new Error("Privacy: banner informativo cookie mancante");
console.log("/formule: listino coerente e selezione Assessment disponibili");

const legalChecks = [
  ["/privacy-policy", ["Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)", "infrastruttura Splendoria", "Diritti dell’interessato"]],
  ["/cookie-policy", ["Via Settala 22–24, Milano (MI)", "spl_session", "splendoria-voice-language", "splendoria-cookie-notice-v1", "non installa cookie pubblicitari"]],
  ["/termini-condizioni", ["Diritto di recesso", "Termini e condizioni", "conferma scritta di Splendoria"]],
  ["/note-legali", ["Note legali", "Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)"]],
  ["/trasparenza-ai", ["Stai interagendo con un sistema di intelligenza artificiale", "supervisione umana"]]
];
for (const [path, expected] of legalChecks) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  const html = await response.text();
  if (response.status !== 200 || expected.some(text => !html.includes(text))) throw new Error(`${path}: informativa incompleta`);
}
const registrationResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati"), env);
const registrationHtml = await registrationResponse.text();
if (!registrationHtml.includes('name="privacyRead"') || !registrationHtml.includes('href="/privacy-policy"') || !registrationHtml.includes('name="passwordConfirm"') || !registrationHtml.includes('data-password-visibility') || !registrationHtml.includes("almeno 10 caratteri")) throw new Error("Registrazione: conferma, visibilità password o presa visione Privacy mancanti");
console.log("/informative: pagine, footer e prese visione legali disponibili");

const studioJs = await worker.fetch(new Request("https://www.splendoria.vip/assets/studio.js"), env);
const studioJsBody = await studioJs.text();
if (studioJs.status !== 200 || !studioJs.headers.get("content-type")?.includes("javascript") || !studioJsBody.includes("SpeechRecognition") || !studioJsBody.includes("data-plan-choice") || !studioJsBody.includes("data-print-book") || !studioJsBody.includes("window.print()")) throw new Error("Asset JavaScript: funzionalità non valide");
if (!studioJsBody.includes("splendoria-writing-position") || !studioJsBody.includes("sessionStorage") || !studioJsBody.includes("data-keep-writing-position")) throw new Error("Muse: mantenimento della posizione di scrittura non disponibile");
if (!studioJsBody.includes("it-IT") || !studioJsBody.includes("de-DE") || !studioJsBody.includes("en-GB") || !studioJsBody.includes("splendoria-voice-language")) throw new Error("Asset JavaScript: lingue della dettatura non valide");
if ((studioJsBody.match(/new SpeechRecognition\(\)/g) || []).length !== 1 || !studioJsBody.includes("const mergeRecognitionText") || !studioJsBody.includes("const recognitionSegments = new Map()") || !studioJsBody.includes("recognitionSegments.set(i") || studioJsBody.includes("finalSegments") || studioJsBody.includes("finalText +=") || !studioJsBody.includes("/api/musa/trascrizione")) throw new Error("Muse: dettatura può duplicare i segmenti o non corregge fedelmente la trascrizione");
const mergeHelperStart = studioJsBody.indexOf("const speechWords =");
const mergeHelperEnd = studioJsBody.indexOf("const setStatus =", mergeHelperStart);
if (mergeHelperStart < 0 || mergeHelperEnd < 0) throw new Error("Muse: funzione di unione dei segmenti vocali non trovata");
const mergeRecognitionText = new Function(`${studioJsBody.slice(mergeHelperStart, mergeHelperEnd)}; return mergeRecognitionText;`)();
const spokenOnce = "Mi chiamo Raoul e vivo a Milano";
let mergedSpeech = "";
for (const repeatedBrowserResult of [spokenOnce, spokenOnce, spokenOnce]) mergedSpeech = mergeRecognitionText(mergedSpeech, repeatedBrowserResult);
if (mergedSpeech !== spokenOnce) throw new Error("Muse: lo stesso risultato vocale viene ancora scritto più volte");
const cumulativeSpeech = mergeRecognitionText("Mi chiamo Raoul", "Mi chiamo Raoul e vivo a Milano");
if (cumulativeSpeech !== spokenOnce || mergeRecognitionText(cumulativeSpeech, "vivo a Milano") !== spokenOnce) throw new Error("Muse: i risultati vocali cumulativi o sovrapposti vengono duplicati");
if (!studioJsBody.includes("data-password-visibility") || !studioJsBody.includes("setCustomValidity") || !studioJsBody.includes("splendoria-cookie-notice-v1") || !studioJsBody.includes("La Musa sta scrivendo…")) throw new Error("Asset JavaScript: password visibile, conferma, banner cookie o stato della Musa non funzionanti");
if (!studioJsBody.includes("data-book-preview") || !studioJsBody.includes("data-book-tab") || !studioJsBody.includes("IntersectionObserver") || !studioJsBody.includes("prefers-reduced-motion")) throw new Error("Asset JavaScript: anteprima del libro o animazioni accessibili mancanti");
if (!studioJsBody.includes("data-legacy-range") || !studioJsBody.includes("data-editorial-assessment") || !studioJsBody.includes("renderAssessment") || !studioJsBody.includes("Indice editoriale orientativo")) throw new Error("Asset JavaScript: slider o generazione della Scheda Tecnica mancanti");
if (!studioJsBody.includes("paginateLiveChapter") || !studioJsBody.includes("livePageForCursor") || !studioJsBody.includes("data-live-chapter") || !studioJsBody.includes("data-live-content") || !studioJsBody.includes("renderLiveChapter(true)")) throw new Error("Studio: anteprima del capitolo non si aggiorna in tempo reale");
if (!studioJsBody.includes("muse-horizontal") || !studioJsBody.includes("chapter-navigator") || !studioJsBody.includes("renderActiveChapter") || !studioJsBody.includes("Salva e passa al capitolo successivo") || !studioJsBody.includes("Altri interventi editoriali")) throw new Error("Studio: Musa orizzontale, capitolo singolo o navigazione editoriale non disponibili");
if (!studioJsBody.includes("/autosalva") || !studioJsBody.includes("Le tue parole sono al sicuro") || !studioJsBody.includes("Sto custodendo le tue parole") || !studioJsBody.includes("8000")) throw new Error("Studio: salvataggio automatico del capitolo non disponibile");
const livePreviewHelperStart = studioJsBody.indexOf("const livePreviewWordsPerPage =");
const livePreviewHelperEnd = studioJsBody.indexOf("document.querySelectorAll('[data-live-chapter]')", livePreviewHelperStart);
if (livePreviewHelperStart < 0 || livePreviewHelperEnd < 0) throw new Error("Studio: paginatore dell’anteprima Royal non trovato");
const paginateLiveChapter = new Function(`${studioJsBody.slice(livePreviewHelperStart, livePreviewHelperEnd)}; return paginateLiveChapter;`)();
const livePreviewPages = paginateLiveChapter(Array.from({ length: 500 }, (_, index) => `parola${index + 1}`).join(" "));
if (livePreviewPages.length !== 3 || livePreviewPages.flatMap(page => page.join(" ").split(/\s+/)).length !== 500) throw new Error("Studio: suddivisione in pagine dell’anteprima in tempo reale non valida");
console.log("/assets/studio.js: dettatura, slider, Assessment e animazioni accessibili disponibili");

const museUser = { id: "cliente-muse", email: "muse@example.com", nome: "Cliente Muse" };
const museProject = {
  id: "libro-muse", userId: museUser.id, title: "La mia storia", genre: "Autobiografia",
  tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: 100,
  sourceMaterial: "Nel 1987 vivevo a Milano con mia nonna Anna, in via Verdi.",
  story: "Sono nato a Milano e ricordo la casa di mia nonna Anna.", people: "Mia nonna Anna", events: "Le estati trascorse nella sua casa", message: "Custodire i ricordi di famiglia", status: "bozza", plan: "free"
};
const museChapter = { id: "capitolo-muse", projectId: museProject.id, position: 1, title: "Il primo ricordo", content: "Un capitolo già iniziato.", status: "generato" };
const museInterview = { projectId: museProject.id, questions: "Quale immagine ricordi della casa di tua nonna?\nChe cosa ti ha insegnato tua nonna?", answers: "" };
const museChapterUpdates = [];
const museProjectUpdates = [];
const museInterviewUpdates = [];
const museBatches = [];
const museDb = {
  prepare(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes('UPDATE "BookChapter" SET title=?,content=?')) museChapterUpdates.push(this.values);
        if (sql.includes('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?')) museProjectUpdates.push(this.values);
        if (sql.includes('UPDATE "BookInterview" SET answers=?')) museInterviewUpdates.push(this.values);
        return { success: true };
      },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: [museChapter] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return museUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return museProject;
        if (sql.includes('FROM "BookChapter"')) return museChapter;
        if (sql.includes('FROM "BookInterview"')) return museInterview;
        return null;
      }
    };
  },
  async batch(statements) { museBatches.push(statements.length); const results=[]; for(const statement of statements)results.push(await statement.run()); return results; }
};
const museResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse", { headers: { cookie: "spl_session=test" } }), { ...env, DB: museDb });
const museHtml = await museResponse.text();
if (museResponse.status !== 200 || !museHtml.includes("Racconta con la tua voce") || !museHtml.includes("data-voice-language")) throw new Error("Muse: nuova sezione non disponibile");
if (!museHtml.includes('<option value="it-IT">Italiano</option>') || !museHtml.includes('<option value="de-DE">Deutsch</option>') || !museHtml.includes('<option value="en-GB">English</option>')) throw new Error("Muse: selettore trilingue non valido");
if (!museHtml.includes('aria-live="polite"')) throw new Error("Muse: stato della dettatura non accessibile");
if (!museHtml.includes("Trasparenza IA") || !museHtml.includes("Gli output restano modificabili") || !museHtml.includes('name="specialDataConsent"')) throw new Error("Muse: trasparenza IA o consenso ai dati particolari mancante");
if (!museHtml.includes("DAMMI ALTRI DATI E FATTI") || !museHtml.includes('name="sourceMaterial"') || !museHtml.includes("date, luoghi, nomi e ruoli dei personaggi")) throw new Error("Muse: campo per dati, fatti, date e personaggi non disponibile");
if (!museHtml.includes('id="chapter-card-capitolo-muse"') || !museHtml.includes('data-keep-writing-position') || !museHtml.includes('data-book-path="/libro/libro-muse"')) throw new Error("Muse: capitolo non predisposto a mantenere la posizione");
if (!museHtml.includes('Titolo del capitolo') || !museHtml.includes('name="title" value="Il primo ricordo"')) throw new Error("Studio: titolo del capitolo non modificabile");
if (!museHtml.includes('data-live-chapter') || !museHtml.includes("Anteprima PDF in tempo reale") || !museHtml.includes('data-live-title') || !museHtml.includes('data-live-page-status') || !museHtml.includes('data-live-prev') || !museHtml.includes('data-live-next') || !museHtml.includes("Royal · Garamond") || !museHtml.includes("Apri l’anteprima completa")) throw new Error("Studio: anteprima Royal del singolo capitolo incompleta");
if (!museHtml.includes("--studio-type-small:16px;--studio-type-body:18px;--studio-type-reading:22px") || !museHtml.includes("min-height:680px") || !museHtml.includes("min-height:380px") || !museHtml.includes("min-height:260px")) throw new Error("Studio: campi più grandi o gerarchia tipografica a tre misure non applicati");
if (!museHtml.includes("12 capitoli · circa 7 pagine ciascuno") || !museHtml.includes("18 capitoli · circa 6–7 pagine ciascuno") || !museHtml.includes("Avanzamento del libro") || !museHtml.includes("pagine stimate")) throw new Error("Studio: strutture o avanzamento parole/pagine mancanti");
const improveButtonCount = (museHtml.match(/✦ Migliora/g) || []).length;
const museDraftButtonCount = (museHtml.match(/>Affidati alla Musa<\/button>/g) || []).length;
if (improveButtonCount < 7 || museDraftButtonCount !== improveButtonCount || !museHtml.includes('formaction="/libro/libro-muse/migliora"') || !museHtml.includes('formaction="/libro/libro-muse/affidati"') || !museHtml.includes('formaction="/libro/libro-muse/risposte/affidati"') || !museHtml.includes('value="improve"')) throw new Error("Muse: Migliora e Affidati alla Musa non sono affiancati in tutti i campi di scrittura");
if (!museHtml.includes('id="intervista-narrativa"') || !museHtml.includes("Affida queste risposte alla Musa")) throw new Error("Muse: generazione contestuale dell'intera intervista non disponibile");
const chapterSaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/salva", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ title: "Il titolo aggiornato", content: "Il testo aggiornato del capitolo." })
}), { ...env, DB: museDb });
if (chapterSaveResponse.status !== 303 || chapterSaveResponse.headers.get("location") !== "/libro/libro-muse#chapter-card-capitolo-muse") throw new Error("Studio: ritorno al capitolo modificato non valido");
if (!museChapterUpdates.some(values => values[0] === "Il titolo aggiornato" && values[1] === "Il testo aggiornato del capitolo.")) throw new Error("Studio: nuovo titolo del capitolo non salvato in Cloudflare D1");
const chapterAutosaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/autosalva", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ title: "Titolo custodito automaticamente", content: "Queste parole sono state salvate senza interrompere la scrittura." })
}), { ...env, DB: museDb });
const chapterAutosave = await chapterAutosaveResponse.json();
if (chapterAutosaveResponse.status !== 200 || !chapterAutosave.ok || chapterAutosave.words !== 9 || !chapterAutosave.savedAt) throw new Error(`Studio: risposta dell’autosalvataggio non valida (${chapterAutosaveResponse.status}: ${JSON.stringify(chapterAutosave)})`);
if (!museChapterUpdates.some(values => values[0] === "Titolo custodito automaticamente" && values[1] === "Queste parole sono state salvate senza interrompere la scrittura." && values[4] === "capitolo-muse" && values[5] === "libro-muse")) throw new Error("Studio: autosalvataggio non scritto in D1 sul capitolo corretto");
const dictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "ciao mi chiamo Anna e ho 72 anni", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ciao, mi chiamo Anna e ho 72 anni." }; } } });
const correctedDictation = await dictationResponse.json();
if (dictationResponse.status !== 200 || correctedDictation.text !== "Ciao, mi chiamo Anna e ho 72 anni.") throw new Error("Muse: trascrizione fedele con sole correzioni grammaticali non valida");
const repeatedDictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "ciao mi chiamo Anna e ho 72 anni ciao mi chiamo Anna e ho 72 anni ciao mi chiamo Anna e ho 72 anni", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ciao, mi chiamo Anna e ho 72 anni." }; } } });
const repeatedDictation = await repeatedDictationResponse.json();
if (repeatedDictationResponse.status !== 200 || repeatedDictation.text !== "Ciao, mi chiamo Anna e ho 72 anni.") throw new Error("Muse: la correzione della dettatura non elimina la triplicazione accidentale");
const fallbackDictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "questa frase compare tre volte questa frase compare tre volte questa frase compare tre volte", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { throw new Error("AI non disponibile"); } } });
const fallbackDictation = await fallbackDictationResponse.json();
if (fallbackDictation.text !== "Questa frase compare tre volte.") throw new Error("Muse: la rimozione delle ripetizioni dipende ancora dalla disponibilità dell'AI");
const improveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/migliora", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ improveField: "story", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: "sono nato a Milano e ricordo la casa di mia nonna sono nato a Milano e ricordo la casa di mia nonna sono nato a Milano e ricordo la casa di mia nonna", people: "", events: "", message: "", specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Sono nato a Milano e ricordo con chiarezza la casa accogliente di mia nonna." }; } } });
const improvedProject = museProjectUpdates.find(values => values[3] === 84 && values[5]?.includes("con chiarezza"));
if (improveResponse.status !== 303 || !improvedProject || (improvedProject[5].match(/Sono nato a Milano/g) || []).length !== 1) throw new Error("Muse: Migliora non corregge o non elimina le ripetizioni prima di salvare nel progetto D1");
const projectDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ museField: "events", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: "Sono nato a Milano e ogni estate tornavo nella casa di mia nonna Anna.", people: "Mia nonna Anna", events: "", message: "Custodire i ricordi di famiglia", specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ricordo come momento decisivo le estati trascorse nella casa di mia nonna Anna a Milano, dove imparavo a custodire i ricordi di famiglia." }; } } });
if (projectDraftResponse.status !== 303 || !museProjectUpdates.some(values => values[7]?.includes("momento decisivo"))) throw new Error("Muse: Affidati alla Musa non genera e salva una bozza contestuale nel campo del progetto");
let regenerationCalls = 0, reviewCalls = 0;
const regeneratedDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ museField: "events", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: museProject.story, people: museProject.people, events: "", message: museProject.message, specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  const system = options.messages?.[0]?.content || "";
  if (system.includes("controllo qualità editoriale")) { reviewCalls += 1; return { response: reviewCalls === 1 ? "RIFIUTATO: il testo non ha un ordine narrativo chiaro" : "APPROVATO" }; }
  regenerationCalls += 1;
  return { response: regenerationCalls === 1 ? "Milano e Anna restano nel ricordo della casa, ma il racconto procede senza un ordine chiaro." : "Ricordo come momento decisivo le estati trascorse a Milano nella casa di mia nonna Anna: lì ho compreso quanto fosse importante custodire i ricordi della nostra famiglia." };
} } });
const regeneratedProject = museProjectUpdates[museProjectUpdates.length - 1] || [];
if (regeneratedDraftResponse.status !== 303 || regenerationCalls !== 2 || reviewCalls !== 2 || !regeneratedProject[7]?.includes("momento decisivo") || regeneratedProject[7]?.includes("senza un ordine chiaro")) throw new Error("Muse: una bozza respinta dal controllo qualità non viene rigenerata automaticamente prima del salvataggio");
const singleAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ricordo la casa di mia nonna Anna a Milano, dove trascorrevo le estati della mia infanzia." }; } } });
if (singleAnswerResponse.status !== 303 || singleAnswerResponse.headers.get("location") !== "/libro/libro-muse#interview-step-0" || !museInterviewUpdates.some(values => values[0]?.includes("Ricordo la casa di mia nonna Anna"))) throw new Error("Muse: Affidati alla Musa non genera la singola risposta contestuale");
const secondAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "1", answer_0: "Ricordo la casa di mia nonna Anna a Milano.", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  return { response: options.messages?.[0]?.content?.includes("controllo qualità editoriale") ? "APPROVATO" : "Mia nonna Anna mi ha insegnato che custodire i ricordi della famiglia significa conservarne il valore nel tempo." };
} } });
if (secondAnswerResponse.status !== 303 || secondAnswerResponse.headers.get("location") !== "/libro/libro-muse#interview-step-1" || !museInterviewUpdates.some(values => values[0]?.includes("Domanda 2:") && values[0]?.includes("conservarne il valore nel tempo"))) throw new Error("Muse: generazione non stabile su una seconda domanda contestuale");
const sparseProject = {
  ...museProject, id: "libro-ferrari", title: "Ferrari Trento", sourceMaterial: "", story: "", people: "", events: "", message: ""
};
const sparseQuestion = "In che modo l'incontro con il gusto unico delle bollicine Ferrari Trento ha influenzato il tuo legame con la tradizione e la cultura italiana, e come ti ha fatto sentire parte di qualcosa di più grande?";
const sparseInterview = { projectId: sparseProject.id, questions: sparseQuestion, answers: "" };
const sparseDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes('UPDATE "BookInterview" SET answers=?')) sparseInterview.answers = this.values[0];
        return { success: true };
      },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: [] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return museUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return sparseProject;
        if (sql.includes('FROM "BookInterview"')) return sparseInterview;
        return null;
      }
    };
  },
  async batch(statements) { const results=[]; for(const statement of statements)results.push(await statement.run()); return results; }
};
const sparseDraft = "L'incontro con il gusto unico delle bollicine Ferrari Trento ha rafforzato il mio legame con la tradizione e la cultura italiana. In quel gusto riconosco un sapere che appartiene a una storia condivisa: per questo mi sento parte di qualcosa di più grande, capace di unire memoria, territorio e cultura.";
const sparseAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "" })
}), { ...env, DB: sparseDb, AI: { async run(_model, options) {
  return { response: options.messages?.[0]?.content?.includes("controllo qualità editoriale") ? "APPROVATO" : sparseDraft };
} } });
if (sparseAnswerResponse.status !== 303 || !sparseInterview.answers.includes("Ferrari Trento") || !sparseInterview.answers.includes("qualcosa di più grande")) throw new Error("Muse: la domanda non viene usata come fonte e il campo resta vuoto quando mancano altri materiali");
const sparseEditorResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari", { headers: { cookie: "spl_session=test" } }), { ...env, DB: sparseDb });
const sparseEditorHtml = await sparseEditorResponse.text();
if (sparseEditorResponse.status !== 200 || !sparseEditorHtml.includes('id="interview-0"') || !sparseEditorHtml.includes("qualcosa di più grande")) throw new Error("Muse: la risposta generata viene salvata ma non ricompare nel campo corrispondente");
let strictReviewCalls = 0, safeRescueCalls = 0;
const safeRescueDraft = "Il gusto delle bollicine Ferrari Trento mi avvicina alla tradizione e alla cultura italiana. Vi riconosco un legame con una storia condivisa, e proprio questo legame mi fa sentire parte di qualcosa di più grande.";
const rescuedAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "" })
}), { ...env, DB: sparseDb, AI: { async run(_model, options) {
  const system = options.messages?.[0]?.content || "";
  if (system.includes("controllo qualità editoriale")) { strictReviewCalls += 1; return { response: "RIFIUTATO: controllo prudenziale" }; }
  if (system.includes("redattrice di sicurezza")) { safeRescueCalls += 1; return { response: safeRescueDraft }; }
  return { response: sparseDraft };
} } });
if (rescuedAnswerResponse.status !== 303 || strictReviewCalls !== 2 || safeRescueCalls !== 1 || !sparseInterview.answers.includes(safeRescueDraft)) throw new Error("Muse: dopo due bozze respinte non produce una risposta sicura e lascia il campo vuoto");
const allAnswersResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ answer_0: "", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "RISPOSTA 1: Ricordo la casa di mia nonna Anna a Milano, dove trascorrevo le estati della mia infanzia.\n\nRISPOSTA 2: Mia nonna Anna mi ha insegnato a custodire i ricordi di famiglia." }; } } });
const generatedInterview = museInterviewUpdates[museInterviewUpdates.length - 1]?.[0] || "";
if (allAnswersResponse.status !== 303 || allAnswersResponse.headers.get("location") !== "/libro/libro-muse#intervista-narrativa" || !generatedInterview.includes("Domanda 1:") || !generatedInterview.includes("Domanda 2:") || !generatedInterview.includes("custodire i ricordi di famiglia")) throw new Error("Muse: Affida queste risposte alla Musa non genera tutte le basi pertinenti dell'intervista");
let chapterGenerationCalls = 0;
const chapterDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/genera", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ title: "Il primo ricordo", content: "Un capitolo già iniziato." })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  const system = options.messages?.[0]?.content || "";
  if (system.includes("controllo qualità editoriale")) return { response: "APPROVATO" };
  chapterGenerationCalls += 1;
  if (chapterGenerationCalls === 1) return { response: "La casa di mia nonna Anna a Milano custodiva la memoria della famiglia. Il ricordo non trova ancora una forma. La casa di mia nonna Anna a Milano custodiva la memoria della famiglia." };
  return { response: "Le estati trascorse nella casa di mia nonna Anna, a Milano, sono il centro di questo ricordo. In quella casa imparavo a custodire la memoria della nostra famiglia. Ripensando a quel periodo, comprendo che la presenza di Anna ha dato continuità alle mie radici e ha reso quei ricordi parte del messaggio che desidero lasciare alla mia famiglia." };
} } });
const regeneratedChapter = [...museChapterUpdates].reverse().find(values => values[2] === "generato");
if (chapterDraftResponse.status !== 303 || chapterGenerationCalls !== 2 || !regeneratedChapter?.[1]?.includes("Le estati trascorse") || (regeneratedChapter?.[1]?.match(/custodiva la memoria/g) || []).length) throw new Error("Muse: il capitolo ripetitivo non viene scartato e rigenerato automaticamente");
const outlineResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/struttura", { method: "POST", headers: { cookie: "spl_session=test" } }), { ...env, DB: museDb });
if (outlineResponse.status !== 303 || !museBatches.includes(14)) throw new Error("Muse: struttura da 12 capitoli non generata integralmente");
console.log("/libro/libro-muse: sezione Muse e selettore trilingue disponibili");

const previewUser = { id: "admin-pdf", email: "raoulragazzi@gmail.com", nome: "Raoul" };
const previewProject = { id: "libro-pdf", userId: "cliente-pdf", title: "La mia vita", authorName: "Ulli" };
const previewChapters = [
  { id: "cap-1", projectId: "libro-pdf", position: 1, title: "La mia infanzia", content: "Questo è il primo capoverso del libro.\n\nQuesto è il secondo capoverso, pronto per la stampa." },
  { id: "cap-2", projectId: "libro-pdf", position: 2, title: "La mia famiglia", content: "Un altro capitolo della storia." }
];
const previewDb = {
  prepare(sql) {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: previewChapters };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('u.nome authorName')) return previewProject;
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const previewResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/progetto/libro-pdf/anteprima", { headers: { cookie: "spl_session=test" } }), { ...env, DB: previewDb });
const previewHtml = await previewResponse.text();
const printRequirements = ["data-print-book", "Formato Royal", "155,6 × 233,9 mm", "size:171.575mm 249.892mm", "margin-top:27.53mm", "margin-bottom:28mm", "margin-left:35.94mm", "margin-right:20.7mm", "@top-left-corner", "@bottom-right-corner", "3 mm di abbondanza", "book-crop-marks", "crop-top-left", "eb-garamond-400.woff2", "font-size:14pt", "line-height:15.68pt", "font-size:20pt", "font-size:11pt", "text-align:justify", "text-indent:12.5mm", "La mia infanzia"];
if (previewResponse.status !== 200 || printRequirements.some(text => !previewHtml.includes(text))) throw new Error("PDF: impaginazione Royal con linee di taglio incompleta");
const titlePageHtml = previewHtml.match(/<section class="book-title-page">([\s\S]*?)<\/section>/)?.[1] || "";
if (!titlePageHtml || /Splendoria/i.test(titlePageHtml) || titlePageHtml.includes("book-imprint\"")) throw new Error("PDF: la scritta Splendoria è ancora presente nella prima pagina");
if (previewHtml.includes('onclick="window.print()"')) throw new Error("PDF: gestore inline incompatibile con la CSP ancora presente");
if (!previewHtml.includes("Controllo umano dei contenuti") || !previewHtml.includes("diritti d’autore") || !previewHtml.includes("non sostituisce una valutazione legale")) throw new Error("Admin: checklist riservata di controllo contenuti mancante");
console.log("/anteprima: stampa PDF Royal 155,6 × 233,9 mm con abbondanza e linee di taglio disponibile");

const legacyPreviewDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [] };
        if (sql.includes('FROM "Capitolo" WHERE userId=')) return { results: [
          { titolo: "Capitolo 1: La mia infanzia", testo: "Il contenuto storico del primo capitolo.", genere: "Autobiografia", createdAt: "2026-01-01", updatedAt: "2026-01-02" },
          { titolo: "Capitolo 2 - La famiglia", testo: "Il contenuto storico del secondo capitolo.", genere: "Autobiografia", createdAt: "2026-01-03", updatedAt: "2026-01-04" }
        ] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT id,nome,email FROM "User"')) return { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com" };
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const legacyPreviewResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico/anteprima-storica", { headers: { cookie: "spl_session=test" } }), { ...env, DB: legacyPreviewDb });
const legacyPreviewHtml = await legacyPreviewResponse.text();
if (legacyPreviewResponse.status !== 200 || !legacyPreviewHtml.includes("La mia Vita") || !legacyPreviewHtml.includes("La mia infanzia") || !legacyPreviewHtml.includes("Il contenuto storico del secondo capitolo") || legacyPreviewHtml.includes("Capitolo 1: La mia infanzia</h2>")) throw new Error("Admin: anteprima PDF dei capitoli storici non valida");
console.log("/admin/cliente: anteprima PDF dei contenuti storici disponibile");

const dashboardDb = {
  prepare(sql) {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [] };
        if (sql.includes('SELECT p.id,p.title,p.genre')) return { results: [{ id: "libro-dashboard", title: "Una storia", genre: "Memoriale", status: "bozza", plan: "free", updatedAt: "2026-08-05", nome: "Maria", email: "maria@example.com", chapters: 4, completed: 2, statoEditoriale: "in_lavorazione", statoCommerciale: "gratuito" }] };
        if (sql.includes('SELECT u.id userId,u.nome,u.email,COUNT(c.id)')) return { results: [{ userId: "cliente-storico", nome: "Ulli", email: "ulli@example.com", chapters: 14, completed: 14, updatedAt: "2026-08-04", genre: "Autobiografia", statoEditoriale: "bozza", statoCommerciale: "gratuito" }] };
        if (sql.includes('SELECT u.id,u.nome,u.email,u.createdAt')) return { results: [
          { id: "cliente-dashboard", nome: "Maria", email: "maria@example.com", createdAt: "2026-08-01", books: 1, orders: 0, legacyChapters: 0, latestProjectId: "libro-dashboard", latestStatus: "bozza", chapters: 4, completedChapters: 2 },
          { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com", createdAt: "2026-07-01", books: 0, orders: 1, legacyChapters: 14, legacyCompletedChapters: 7, latestProjectId: null, latestStatus: null, chapters: 0, completedChapters: 0 }
        ] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT (SELECT COUNT(*) FROM "User"')) return { users: 2, books: 2, completed: 0, orders: 1 };
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const dashboardResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin", { headers: { cookie: "spl_session=test" } }), { ...env, DB: dashboardDb });
const dashboardHtml = await dashboardResponse.text();
if (dashboardResponse.status !== 200 || !dashboardHtml.includes("Maria") || !dashboardHtml.includes("50% · 2/4 capitoli") || !dashboardHtml.includes("50% · 7/14") || !dashboardHtml.includes('/admin/progetto/libro-dashboard/anteprima') || !dashboardHtml.includes('/admin/cliente/cliente-storico/anteprima-storica') || !dashboardHtml.includes('/admin/cliente/cliente-storico') || (dashboardHtml.match(/Vedi PDF/g) || []).length < 4 || (dashboardHtml.match(/Gestisci e sblocca/g) || []).length < 4) throw new Error("Admin: utenti, avanzamento, PDF o controlli di sblocco non visibili");
console.log("/admin: utenti, avanzamento, PDF e controlli di sblocco visibili");

const legacyManagementState = { projectAdmin: null, orderStatus: null };
const legacyManagementDb = {
  prepare(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: ["projectId", "termsAcceptedAt", "privacyAcceptedAt", "specialDataConsentAt", "usedAt", "deliveryStatus", "deliveryError", "deliveredAt", "messageId"].map(name => ({ name })) };
        if (sql.includes('SELECT titolo,genere,length(testo)')) return { results: [
          { titolo: "Capitolo 1: Le radici", genere: "Autobiografia", chars: 1200, updatedAt: "2026-08-01" },
          { titolo: "Capitolo 2: La svolta", genere: "Autobiografia", chars: 1800, updatedAt: "2026-08-02" }
        ] };
        if (sql.includes('SELECT * FROM "Ordine" WHERE userId=')) return { results: [{ formula: "digital", prezzo: 1000, stato: legacyManagementState.orderStatus || "da_pagare" }] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT u.id,u.nome,u.email,a.statoEditoriale')) return { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com", statoEditoriale: "in_lavorazione", statoCommerciale: legacyManagementState.projectAdmin?.[2] || "gratuito", tutor: "", note: "" };
        if (sql.includes('SELECT id FROM "User" WHERE id=')) return { id: "cliente-storico" };
        if (sql.includes('SELECT id FROM "Capitolo" WHERE userId=')) return { id: "capitolo-storico" };
        return null;
      }
    };
  },
  async batch(statements) {
    for (const statement of statements) {
      if (statement.sql.startsWith('INSERT INTO "ProjectAdmin"')) legacyManagementState.projectAdmin = statement.values;
      if (statement.sql.startsWith('UPDATE "Ordine" SET stato=')) legacyManagementState.orderStatus = statement.values[0];
    }
    return statements.map(() => ({ success: true }));
  }
};
const legacyManagementResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico", { headers: { cookie: "spl_session=test" } }), { ...env, DB: legacyManagementDb });
const legacyManagementHtml = await legacyManagementResponse.text();
if (legacyManagementResponse.status !== 200 || !legacyManagementHtml.includes("Gestione interna e sblocco") || !legacyManagementHtml.includes('value="pagato"') || !legacyManagementHtml.includes('value="rimborsato"')) throw new Error("Admin: gestione commerciale del libro storico non disponibile");
const legacyManagementPost = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico", { method: "POST", headers: { cookie: "spl_session=test" }, body: new URLSearchParams({ statoEditoriale: "approvato", statoCommerciale: "pagato", tutor: "Tutor", note: "Pagamento verificato" }) }), { ...env, DB: legacyManagementDb });
const legacyManagementPostHtml = await legacyManagementPost.text();
if (legacyManagementPost.status !== 200 || !legacyManagementPostHtml.includes("Stato del libro storico aggiornato") || legacyManagementState.projectAdmin?.[1] !== "approvato" || legacyManagementState.projectAdmin?.[2] !== "pagato" || legacyManagementState.orderStatus !== "pagato") throw new Error("Admin: salvataggio o sblocco del libro storico non riuscito");
console.log("/admin/cliente: stati gratuito, da pagare, pagato e rimborsato ripristinati");

let contactValues = null;
let contactDelivery = null;
const contactDb = {
  prepare(sql) {
    return {
      bind(...values) {
        if (sql.includes('INSERT INTO "ContactMessage"')) contactValues = values;
        if (sql.includes('UPDATE "ContactMessage" SET deliveryStatus=')) contactDelivery = values;
        return this;
      },
      async run() { return { success: true }; },
      async first() { return null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const contactBody = new URLSearchParams({ fullName: "Mario Rossi", phone: "+39 000 000000", email: "mario@example.com", plan: "assisted", subject: "Vorrei informazioni", message: "Contattatemi, grazie.", privacyRead: "yes" });
let contactEmail = null;
const contactResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: contactBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send(message) { contactEmail = message; return { messageId: "contact-message-id" }; } } });
if (contactResponse.status !== 303 || contactResponse.headers.get("location") !== "/?contatto=inviato#contatti" || !contactValues?.[4]?.includes("Splendoria Signature") || !contactValues?.[5]?.startsWith("Formula scelta: Splendoria Signature")) throw new Error("Contatti: formula selezionata non registrata");
if (contactEmail?.to !== "raoulragazzi@gmail.com" || !contactEmail?.text?.includes("mario@example.com") || contactDelivery?.[0] !== "sent") throw new Error("Contatti: email non inoltrata all’amministratore");

contactValues = null;
contactDelivery = null;
const assessmentBody = new URLSearchParams({ assessment: "editorial", fullName: "Anna Bianchi", phone: "+39 111 111111", email: "anna@example.com", plan: "complete", legacyScope: "Una storia generazionale", turningOrigins: "yes", turningRelationships: "yes", turningVision: "yes", memoryKeywords: "cascina, fotografie, domenica", governance: "Livello 3 · Supervisione umana", privacyRead: "yes" });
const assessmentResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: assessmentBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send(message) { contactEmail = message; return { messageId: "assessment-message-id" }; } } });
if (assessmentResponse.headers.get("location") !== "/?contatto=inviato#contatti" || !contactValues?.[4]?.includes("Assessment editoriale Splendoria") || !contactValues?.[5]?.includes("Una storia generazionale") || !contactValues?.[5]?.includes("cascina, fotografie, domenica") || !contactEmail?.text?.includes("Livello 3 · Supervisione umana")) throw new Error("Assessment: fallback senza JavaScript non genera o non inoltra la Scheda Tecnica");

contactDelivery = null;
const failedContactResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: contactBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send() { const error = new Error("Destinazione non disponibile"); error.code = "E_DESTINATION"; throw error; } } });
if (failedContactResponse.headers.get("location") !== "/?contatto=errore#contatti" || contactDelivery?.[0] !== "failed" || !contactDelivery?.[1]?.includes("E_DESTINATION")) throw new Error("Contatti: errore di consegna non gestito");

let forwardedTo = null;
await worker.email({ async forward(destination) { forwardedTo = destination; } }, env);
if (forwardedTo !== "raoulragazzi@gmail.com") throw new Error("Posta in entrata: inoltro a Gmail non configurato");
console.log("/contatti: modulo e posta in entrata inoltrati a Gmail");

function authDb(user) {
  return {
    prepare(sql) {
      const statement = {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() { return { success: true }; },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM "Session" s JOIN "User" u')) return user;
          // Nessun progetto viene restituito: simula il tentativo di aprire
          // un libro appartenente a un altro cliente.
          return null;
        }
      };
      return statement;
    },
    async batch(statements) { return statements.map(() => ({ success: true })); }
  };
}

async function expectRedirect(path, user, expected) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`, { headers: { cookie: "spl_session=test" } }), { ...env, DB: authDb(user) });
  if (response.status !== 303 || response.headers.get("location") !== expected) throw new Error(`${path}: atteso redirect ${expected}, ricevuto ${response.status} ${response.headers.get("location")}`);
  console.log(`${path}: accesso separato correttamente`);
}

await expectRedirect("/admin", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/area-amministratore");
await expectRedirect("/libro/progetto-di-un-altro", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/studio");
await expectRedirect("/admin/progetto/progetto-1/anteprima", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/area-amministratore");
await expectRedirect("/studio", { id: "admin-1", email: "raoulragazzi@gmail.com", nome: "Admin" }, "/admin");

function credentialDb(user) {
  const state = { migratedHash: "" };
  const db = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() {
          if (sql.startsWith('UPDATE "User" SET passwordHash=')) state.migratedHash = this.values[0];
          return { success: true };
        },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }, { name: "termsAcceptedAt" }, { name: "privacyAcceptedAt" }, { name: "specialDataConsentAt" }, { name: "deliveryStatus" }, { name: "deliveryError" }, { name: "deliveredAt" }, { name: "messageId" }] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('SELECT * FROM "User" WHERE lower(trim(email))=')) return user;
          return null;
        }
      };
    },
    async batch(statements) { return statements.map(() => ({ success: true })); }
  };
  return { db, state };
}

const legacyPassword = "PasswordCorretta1!";
const clientCredentials = credentialDb({ id: "legacy-client", email: "ulli@apple.bz", nome: "Ulli", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const clientLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz", password: legacyPassword }) }), { ...env, DB: clientCredentials.db });
if (clientLogin.status !== 303 || clientLogin.headers.get("location") !== "/studio" || !clientLogin.headers.get("set-cookie")?.includes("spl_session=")) throw new Error("Login: account cliente storico non accettato");
if (!clientCredentials.state.migratedHash.startsWith("pbkdf2$")) throw new Error("Login: hash storico non migrato");

const shortLegacyPassword = "Breve7!";
const portableBcryptHash = (await bcrypt.hash(shortLegacyPassword, 4)).replace(/^\$2[ab]\$/, "$2y$");
const portableCredentials = credentialDb({ id: "portable-client", email: " ULLI@APPLE.BZ ", nome: "Ulli", passwordHash: portableBcryptHash });
const portableLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz", password: shortLegacyPassword }) }), { ...env, DB: portableCredentials.db });
if (portableLogin.status !== 303 || portableLogin.headers.get("location") !== "/studio") throw new Error("Login: email storica o variante bcrypt non accettata");

const adminCredentials = credentialDb({ id: "legacy-admin", email: env.ADMIN_EMAIL, nome: "Raoul", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const adminLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: env.ADMIN_EMAIL, password: legacyPassword }) }), { ...env, DB: adminCredentials.db });
if (adminLogin.status !== 303 || adminLogin.headers.get("location") !== "/admin") throw new Error("Login: account amministratore storico non accettato");

const wrongAreaCredentials = credentialDb({ id: "client-role", email: "cliente@example.com", nome: "Cliente", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const wrongAreaLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: "cliente@example.com", password: legacyPassword }) }), { ...env, DB: wrongAreaCredentials.db });
const wrongAreaHtml = await wrongAreaLogin.text();
if (wrongAreaLogin.status !== 200 || !wrongAreaHtml.includes("non è autorizzato")) throw new Error("Login: separazione dei ruoli non applicata");
console.log("/login: account storici migrati e ruoli separati");

function registrationDb() {
  const state = { usersByEmail: new Map(), usersById: new Map(), sessions: new Map(), notifications: new Map(), insertedUsers: 0, registrationBatchSize: 0, passwordHash: "" };
  const db = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() {
          if (sql.startsWith('INSERT INTO "User"')) {
            const [id, email, passwordHash, nome, privacyAcceptedAt, createdAt] = this.values;
            const user = { id, email, passwordHash, nome, privacyAcceptedAt, createdAt };
            state.usersByEmail.set(email, user);
            state.usersById.set(id, user);
            state.insertedUsers += 1;
            state.passwordHash = passwordHash;
          }
          if (sql.startsWith('INSERT INTO "Session"')) {
            const [id, userId, tokenHash, expiresAt, createdAt] = this.values;
            state.sessions.set(tokenHash, { id, userId, tokenHash, expiresAt, createdAt });
          }
          if (sql.startsWith('INSERT INTO "RegistrationNotification"')) {
            const [id, userId, nome, email, deliveryStatus, deliveryError, attempts, lastAttemptAt, acceptedAt, messageId, createdAt] = this.values;
            state.notifications.set(id, { id, userId, nome, email, deliveryStatus, deliveryError, attempts, lastAttemptAt: lastAttemptAt || "", acceptedAt, messageId, createdAt });
          }
          if (sql.startsWith(`UPDATE "RegistrationNotification" SET deliveryStatus='sending'`)) {
            const notification = state.notifications.get(this.values[1]);
            if (notification) Object.assign(notification, { deliveryStatus: "sending", attempts: Number(notification.attempts || 0) + 1, lastAttemptAt: this.values[0] });
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET deliveryStatus=?,deliveryError=?,acceptedAt=')) {
            const notification = state.notifications.get(this.values[4]);
            if (notification) Object.assign(notification, { deliveryStatus: this.values[0], deliveryError: this.values[1], acceptedAt: this.values[2], messageId: this.values[3] });
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET deliveryStatus=?,deliveryError=? WHERE id=')) {
            const notification = state.notifications.get(this.values[2]);
            if (notification) Object.assign(notification, { deliveryStatus: this.values[0], deliveryError: this.values[1] });
          }
          if (sql.startsWith('DELETE FROM "Session" WHERE tokenHash=')) state.sessions.delete(this.values[0]);
          return { success: true, meta: { changes: 1 } };
        },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [] };
          if (sql.includes('FROM "RegistrationNotification" WHERE attempts<5')) return { results: [...state.notifications.values()].filter(notification => notification.attempts < 5 && notification.deliveryStatus !== "sent") };
          if (sql.includes('FROM "BookProject" p LEFT JOIN "BookChapter"')) return { results: [] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM "Session" s JOIN "User" u')) {
            const session = state.sessions.get(this.values[0]);
            return session ? state.usersById.get(session.userId) : null;
          }
          if (sql.includes('SELECT id FROM "User" WHERE lower(trim(email))=')) return state.usersByEmail.get(this.values[0]) || null;
          if (sql.includes('SELECT * FROM "User" WHERE lower(trim(email))=')) return state.usersByEmail.get(this.values[0]) || null;
          return null;
        }
      };
    },
    async batch(statements) {
      state.registrationBatchSize = statements.length;
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    }
  };
  return { db, state };
}

const registration = registrationDb();
const newEmail = "nuova.cliente@example.com", newPassword = "PasswordNuova2026!";
const mismatchResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: "errore@example.com", nome: "Errore", password: newPassword, passwordConfirm: "PasswordDiversa2026!", privacyRead: "yes" }) }), { ...env, DB: registration.db });
const mismatchHtml = await mismatchResponse.text();
if (mismatchResponse.status !== 200 || !mismatchHtml.includes("Le due password non coincidono") || !mismatchHtml.includes('value="errore@example.com"') || registration.state.insertedUsers !== 0) throw new Error("Registrazione: password discordanti non gestite correttamente");

let registrationEmail = null;
const registerResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: newEmail, nome: "Nuova Cliente", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: registration.db, CONTACT_EMAIL: { async send(message) { registrationEmail = message; return { messageId: "registration-message-id" }; } } });
const firstCookie = registerResponse.headers.get("set-cookie")?.match(/^spl_session=([^;]+)/)?.[1];
if (registerResponse.status !== 303 || registerResponse.headers.get("location") !== "/studio" || !firstCookie || registration.state.insertedUsers !== 1 || registration.state.registrationBatchSize !== 2) throw new Error("Registrazione: creazione atomica di account e sessione non riuscita");
if (!registration.state.passwordHash.startsWith("pbkdf2$100000$")) throw new Error("Registrazione: hash password non compatibile con Cloudflare Workers");
if (registrationEmail?.to !== env.ADMIN_EMAIL || !registrationEmail?.subject?.includes("Nuova iscrizione a Splendoria") || !registrationEmail?.text?.includes("Nuova Cliente") || !registrationEmail?.text?.includes(newEmail) || registrationEmail?.text?.includes(newPassword)) throw new Error("Registrazione: notifica email all’amministratore assente o non sicura");
const storedRegistrationNotification = [...registration.state.notifications.values()][0];
if (storedRegistrationNotification?.deliveryStatus !== "sent" || storedRegistrationNotification?.attempts !== 1 || storedRegistrationNotification?.messageId !== "registration-message-id" || !storedRegistrationNotification?.acceptedAt) throw new Error("Registrazione: esito della notifica email non tracciato su D1");

const studioAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
const studioAfterRegistrationHtml = await studioAfterRegistration.text();
const studioNavigation = studioAfterRegistrationHtml.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (studioAfterRegistration.status !== 200 || !studioAfterRegistrationHtml.includes("Ciao, Nuova Cliente") || ["Come funziona", "Listino", "Contattaci", "Il mio Studio", "Esci"].some(label => !studioNavigation.includes(label))) throw new Error("Registrazione: accesso immediato o menu completo dello Studio non riuscito");

const logoutAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/esci", { method: "POST", headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
if (logoutAfterRegistration.status !== 303 || !logoutAfterRegistration.headers.get("location")?.startsWith("/area-clienti?e=") || !logoutAfterRegistration.headers.get("set-cookie")?.includes("Max-Age=0")) throw new Error("Registrazione: uscita o cancellazione della sessione non riuscita");

const studioAfterLogout = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
if (studioAfterLogout.status !== 303 || studioAfterLogout.headers.get("location") !== "/area-clienti") throw new Error("Registrazione: sessione precedente ancora attiva dopo l’uscita");

const loginAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: newEmail, password: newPassword }) }), { ...env, DB: registration.db });
const secondCookie = loginAfterRegistration.headers.get("set-cookie")?.match(/^spl_session=([^;]+)/)?.[1];
if (loginAfterRegistration.status !== 303 || loginAfterRegistration.headers.get("location") !== "/studio" || !secondCookie || secondCookie === firstCookie) throw new Error("Registrazione: nuovo accesso con le credenziali create non riuscito");
const studioAfterLogin = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
if (studioAfterLogin.status !== 200 || !(await studioAfterLogin.text()).includes("Ciao, Nuova Cliente")) throw new Error("Registrazione: rientro nello Studio non riuscito");
console.log("/registrazione: conferma password, accesso, uscita e nuovo accesso verificati");

const retryRegistration = registrationDb();
let retrySendAttempts = 0;
const failedRegistrationResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: "ritenta@example.com", nome: "Cliente Ritento", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: retryRegistration.db, CONTACT_EMAIL: { async send() { retrySendAttempts += 1; const error = new Error("Servizio temporaneamente non disponibile"); error.code = "E_TEMPORARY"; throw error; } } });
if (failedRegistrationResponse.status !== 303 || [...retryRegistration.state.notifications.values()][0]?.deliveryStatus !== "failed" || retrySendAttempts !== 1) throw new Error("Registrazione: errore temporaneo della notifica non registrato");
await worker.scheduled({}, { ...env, DB: retryRegistration.db, ADMIN_EMAIL_NOTIFICATION: { async send(message) { retrySendAttempts += 1; registrationEmail = message; return { messageId: "registration-retry-id" }; } } });
const retriedNotification = [...retryRegistration.state.notifications.values()][0];
if (retrySendAttempts !== 2 || retriedNotification?.deliveryStatus !== "sent" || retriedNotification?.attempts !== 2 || retriedNotification?.messageId !== "registration-retry-id") throw new Error("Registrazione: ritento automatico della notifica non riuscito");
console.log("/registrazione: email reale tracciata e ritento automatico verificato");

function resetDb() {
  const state = { inserted: null, delivery: null };
  return {
    state,
    db: {
      prepare(sql) {
        return {
          values: [],
          bind(...values) { this.values = values; return this; },
          async run() {
            if (sql.startsWith('INSERT INTO "PasswordReset"')) state.inserted = this.values;
            if (sql.startsWith('UPDATE "PasswordReset" SET deliveryStatus=')) state.delivery = this.values;
            return { success: true };
          },
          async all() {
            if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }, { name: "termsAcceptedAt" }, { name: "privacyAcceptedAt" }, { name: "specialDataConsentAt" }, { name: "deliveryStatus" }, { name: "deliveryError" }, { name: "deliveredAt" }, { name: "messageId" }] };
            return { results: [] };
          },
          async first() {
            if (sql.includes('SELECT id,email,nome FROM "User" WHERE lower(trim(email))=')) return { id: "ulli-id", email: "ulli@apple.bz", nome: "Ulli" };
            return null;
          }
        };
      },
      async batch(statements) { return statements.map(() => ({ success: true })); }
    }
  };
}

let sentEmail = null;
const successfulReset = resetDb();
const resetResponse = await worker.fetch(new Request("https://www.splendoria.vip/password-dimenticata", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz" }) }), { ...env, DB: successfulReset.db, CONTACT_EMAIL: { async send(message) { sentEmail = message; return { messageId: "test-message-id" }; } } });
if (resetResponse.status !== 200 || sentEmail?.to !== "ulli@apple.bz" || !sentEmail?.text?.includes("https://www.splendoria.vip/reimposta-password?token=")) throw new Error("Recupero password: email strutturata non generata");
if (successfulReset.state.delivery?.[0] !== "sent" || successfulReset.state.delivery?.[3] !== "test-message-id") throw new Error("Recupero password: esito positivo non registrato");

const failedReset = resetDb();
const failedResetResponse = await worker.fetch(new Request("https://www.splendoria.vip/password-dimenticata", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz" }) }), { ...env, DB: failedReset.db, CONTACT_EMAIL: { async send() { const error = new Error("Mittente non verificato"); error.code = "E_SENDER_NOT_VERIFIED"; throw error; } } });
if (failedResetResponse.status !== 200 || failedReset.state.delivery?.[0] !== "failed" || !failedReset.state.delivery?.[1]?.includes("E_SENDER_NOT_VERIFIED")) throw new Error("Recupero password: errore di consegna non registrato");
console.log("/password-dimenticata: invio e diagnostica verificati");

const legacyResetSchemaState = { usedAtAdded: false, batchSize: 0 };
const legacyResetSchemaDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql === 'ALTER TABLE "PasswordReset" ADD COLUMN "usedAt" TEXT') legacyResetSchemaState.usedAtAdded = true;
        return { success: true };
      },
      async all() {
        const common = ["projectId", "termsAcceptedAt", "privacyAcceptedAt", "specialDataConsentAt", "deliveryStatus", "deliveryError", "deliveredAt", "messageId"];
        if (sql === 'PRAGMA table_info("PasswordReset")') return { results: [...common, ...(legacyResetSchemaState.usedAtAdded ? ["usedAt"] : [])].map(name => ({ name })) };
        if (sql.startsWith("PRAGMA table_info")) return { results: common.map(name => ({ name })) };
        return { results: [] };
      },
      async first() {
        if (sql.includes('SELECT pr.*,u.email FROM "PasswordReset"')) {
          if (!legacyResetSchemaState.usedAtAdded) throw new Error("no such column: pr.usedAt");
          return { id: "reset-storico", userId: "cliente-storico", email: "cliente@example.com", usedAt: null, expiresAt: new Date(Date.now() + 60000).toISOString() };
        }
        return null;
      }
    };
  },
  async batch(statements) { legacyResetSchemaState.batchSize = statements.length; return statements.map(() => ({ success: true })); }
};
const legacyResetToken = "a".repeat(64), legacyResetPassword = "NuovaPassword2026!";
const legacyResetResponse = await worker.fetch(new Request("https://www.splendoria.vip/reimposta-password", { method: "POST", body: new URLSearchParams({ token: legacyResetToken, password: legacyResetPassword, passwordConfirm: legacyResetPassword }) }), { ...env, DB: legacyResetSchemaDb });
if (legacyResetResponse.status !== 303 || !legacyResetResponse.headers.get("location")?.startsWith("/area-clienti?e=") || !legacyResetSchemaState.usedAtAdded || legacyResetSchemaState.batchSize !== 3) throw new Error("Recupero password: migrazione dello schema storico o salvataggio non riusciti");
console.log("/reimposta-password: schema storico aggiornato e nuova password salvata");
