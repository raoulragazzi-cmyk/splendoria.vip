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
if (!showcaseTypography.includes('class="showcase-page"') || !showcaseTypography.includes('--font-editorial:"Gentium Book Plus"') || !showcaseTypography.includes("--font-ui:Inter") || !showcaseTypography.includes("font-family:var(--font-ui)") || !showcaseTypography.includes("font-family:var(--font-editorial)")) throw new Error("Vetrina: sistema tipografico editoriale serif/sans-serif non applicato");
if (!showcaseTypography.includes("showcase-hero-layout") || !showcaseTypography.includes('src="/assets/splendoria-book-hero.webp"') || !showcaseTypography.includes("Primo capitolo gratuito") || !showcaseTypography.includes("Supervisione umana")) throw new Error("Vetrina: nuova Hero editoriale incompleta");
if (!showcaseTypography.includes('src="/assets/studio.js?v=20260805-2"')) throw new Error("Vetrina: asset JavaScript non versionato contro la cache del browser");
const publicNavigation = showcaseTypography.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (!publicNavigation.includes("Area clienti") || !publicNavigation.includes("Inizia gratis") || publicNavigation.includes("Area amministratore") || publicNavigation.includes("nav-admin-link")) throw new Error("Navigazione: collegamento amministratore ancora esposto nel menu pubblico");
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/gentium-book-plus-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`Vetrina: font locale ${weight} non valido`);
}
const heroImage = readFileSync(new URL("../public/assets/splendoria-book-hero.webp", import.meta.url));
if (heroImage.byteLength < 40000 || heroImage.subarray(0, 4).toString() !== "RIFF" || heroImage.subarray(8, 12).toString() !== "WEBP") throw new Error("Vetrina: immagine Hero WebP non valida");
if (!showcaseTypography.includes('data-book-preview') || !showcaseTypography.includes('role="tablist"') || !showcaseTypography.includes("Il capitolo impaginato") || !showcaseTypography.includes("Esempio dimostrativo")) throw new Error("Vetrina: anteprima interattiva del libro incompleta");
console.log("/vetrina: tipografia editoriale, Hero e anteprima del libro disponibili");

const wranglerConfig = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
if (!wranglerConfig.includes('"database_name": "splendoria-db"') || !wranglerConfig.includes('"database_id": "1a46b8b0-2e6f-44cf-a22f-4950259f9434"') || !wranglerConfig.includes('"APP_URL": "https://www.splendoria.vip"') || !wranglerConfig.includes('"directory": "./public"')) throw new Error("Cloudflare: configurazione di produzione o asset statici non valida");
if (wranglerConfig.includes('"database_name": "splendoria-v2-test"') || wranglerConfig.includes("splendoria-v2.raoulragazzi.workers.dev")) throw new Error("Cloudflare: riferimenti all’ambiente di test ancora attivi");
console.log("/configurazione: database e URL di produzione attivi");

const workerSource = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
for (const table of ["User", "BookProject", "BookChapter", "BookInterview", "Session"]) {
  if (!workerSource.includes(`INSERT INTO "${table}"`)) throw new Error(`Cloudflare D1: scrittura persistente ${table} non trovata`);
}
const localStorageKeys = [...workerSource.matchAll(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)/g)].map(match => match[1]);
const unexpectedLocalStorage = localStorageKeys.filter(key => !["splendoria-cookie-notice-v1", "splendoria-voice-language"].includes(key));
if (unexpectedLocalStorage.length || !workerSource.includes("HttpOnly; Secure; SameSite=Lax")) throw new Error("Persistenza: dati utente o libro esposti nel dispositivo locale");
console.log("/persistenza: utenti, libri, capitoli, interviste e sessioni su Cloudflare D1; in locale solo preferenze tecniche");

const pricingResponse = await worker.fetch(new Request("https://www.splendoria.vip/?formula=complete"), env);
const pricingHtml = await pricingResponse.text();
if (!pricingHtml.includes("Splendoria Digital") || !pricingHtml.includes("Splendoria Premium") || !pricingHtml.includes("Splendoria Signature")) throw new Error("Listino: formule mancanti");
if (!pricingHtml.includes("1.500 €") || !pricingHtml.includes("10 copie cartacee comprese nel prezzo")) throw new Error("Listino: prezzi o contenuti principali non validi");
if (!pricingHtml.includes('class="price-details"') || !pricingHtml.includes("Metodo e interviste") || !pricingHtml.includes("Confronta le tre formule") || !pricingHtml.includes("Possibile, da concordare")) throw new Error("Listino: raggruppamento o confronto delle formule mancante");
if (!pricingHtml.includes('class="review-stars"') || !pricingHtml.includes("Valutazione: 5 stelle su 5") || !pricingHtml.includes('class="mini-cover"')) throw new Error("Social proof: valutazioni o copertine editoriali mancanti");
if (!pricingHtml.includes('<option value="complete" selected>Splendoria Premium</option>')) throw new Error("Listino: formula Premium non riportata nel form");
if (pricingHtml.includes("Hybrid") || pricingHtml.includes("Premium Short Book") || pricingHtml.includes("Personal Branding &amp; Corporate")) throw new Error("Listino: denominazioni precedenti ancora presenti");
if (pricingHtml.includes("prime 5 copie") || pricingHtml.includes("consegna entro 10 giorni")) throw new Error("Listino: promesse della precedente offerta ancora presenti");
if (!pricingHtml.includes("Le copie stampate seguono la formula scelta") || !pricingHtml.includes("riservato ai progetti Signature")) throw new Error("Listino: servizi inclusi o nota Signature non allineati");
if (!pricingHtml.includes("Partita IVA 02950290219") || !pricingHtml.includes('href="/privacy-policy"') || !pricingHtml.includes('href="/cookie-policy"')) throw new Error("Informazioni legali: P.IVA o collegamenti del footer mancanti");
if (pricingHtml.includes("Merano") || pricingHtml.includes("Via J. W. von Goethe")) throw new Error("Informazioni legali: vecchio indirizzo ancora presente");
if (!pricingHtml.includes("Via Settala 22–24, Milano (MI)")) throw new Error("Informazioni legali: indirizzo di Milano mancante");
if (!pricingHtml.includes("Raccontami brevemente come possiamo aiutarti.") || !pricingHtml.includes("<b>Parla con me</b>")) throw new Error("Contatti: testo personale richiesto non applicato");
if (pricingHtml.includes("Raccontaci brevemente come possiamo aiutarti.") || pricingHtml.includes("<b>Titolare del servizio</b>")) throw new Error("Contatti: testo precedente ancora presente");
if (!pricingHtml.includes('name="privacyRead"') || !pricingHtml.includes("Ho letto la")) throw new Error("Contatti: presa visione della Privacy Policy mancante");
if (!pricingHtml.includes('data-cookie-banner') || !pricingHtml.includes("Ho capito e continuo") || !pricingHtml.includes("Non utilizziamo cookie pubblicitari o di profilazione")) throw new Error("Privacy: banner informativo cookie mancante");
console.log("/formule: nuovo listino e selezione automatica disponibili");

const legalChecks = [
  ["/privacy-policy", ["Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)", "Cloudflare Workers AI", "Diritti dell’interessato"]],
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
if (!studioJsBody.includes("it-IT") || !studioJsBody.includes("de-DE") || !studioJsBody.includes("en-GB") || !studioJsBody.includes("splendoria-voice-language")) throw new Error("Asset JavaScript: lingue della dettatura non valide");
if (!studioJsBody.includes("data-password-visibility") || !studioJsBody.includes("setCustomValidity") || !studioJsBody.includes("splendoria-cookie-notice-v1")) throw new Error("Asset JavaScript: password visibile, conferma o banner cookie non funzionanti");
if (!studioJsBody.includes("data-book-preview") || !studioJsBody.includes("data-book-tab") || !studioJsBody.includes("IntersectionObserver") || !studioJsBody.includes("prefers-reduced-motion")) throw new Error("Asset JavaScript: anteprima del libro o animazioni accessibili mancanti");
console.log("/assets/studio.js: dettatura, anteprima e animazioni accessibili disponibili");

const museUser = { id: "cliente-muse", email: "muse@example.com", nome: "Cliente Muse" };
const museProject = {
  id: "libro-muse", userId: museUser.id, title: "La mia storia", genre: "Autobiografia",
  tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: 100,
  story: "Un ricordo", people: "", events: "", message: "", status: "bozza", plan: "free"
};
const museDb = {
  prepare(sql) {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return museUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return museProject;
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const museResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse", { headers: { cookie: "spl_session=test" } }), { ...env, DB: museDb });
const museHtml = await museResponse.text();
if (museResponse.status !== 200 || !museHtml.includes("Racconta con la tua voce") || !museHtml.includes("data-voice-language")) throw new Error("Muse: nuova sezione non disponibile");
if (!museHtml.includes('<option value="it-IT">Italiano</option>') || !museHtml.includes('<option value="de-DE">Deutsch</option>') || !museHtml.includes('<option value="en-GB">English</option>')) throw new Error("Muse: selettore trilingue non valido");
if (!museHtml.includes('aria-live="polite"')) throw new Error("Muse: stato della dettatura non accessibile");
if (!museHtml.includes("Stai interagendo con un sistema di intelligenza artificiale") || !museHtml.includes('name="specialDataConsent"')) throw new Error("Muse: trasparenza IA o consenso ai dati particolari mancante");
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
const printRequirements = ["data-print-book", "size:110mm 180mm", "margin-top:15mm", "margin-bottom:20mm", "margin-left:20mm", "margin-right:15mm", "bleed:3mm", "font-size:11pt", "line-height:13.2pt", "text-align:justify", "text-indent:5mm", "La mia infanzia"];
if (previewResponse.status !== 200 || printRequirements.some(text => !previewHtml.includes(text))) throw new Error("PDF: impaginazione tascabile incompleta");
if (previewHtml.includes('onclick="window.print()"')) throw new Error("PDF: gestore inline incompatibile con la CSP ancora presente");
if (!previewHtml.includes("Controllo umano dei contenuti") || !previewHtml.includes("diritti d’autore") || !previewHtml.includes("non sostituisce una valutazione legale")) throw new Error("Admin: checklist riservata di controllo contenuti mancante");
console.log("/anteprima: stampa PDF tascabile 110 × 180 mm disponibile");

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
const contactDb = {
  prepare(sql) {
    return {
      bind(...values) { if (sql.includes('INSERT INTO "ContactMessage"')) contactValues = values; return this; },
      async run() { return { success: true }; },
      async first() { return null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const contactBody = new URLSearchParams({ fullName: "Mario Rossi", phone: "+39 000 000000", email: "mario@example.com", plan: "assisted", subject: "Vorrei informazioni", message: "Contattatemi, grazie.", privacyRead: "yes" });
const contactResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: contactBody }), { ...env, DB: contactDb });
if (contactResponse.status !== 303 || !contactValues?.[4]?.includes("Splendoria Signature") || !contactValues?.[5]?.startsWith("Formula scelta: Splendoria Signature")) throw new Error("Contatti: formula selezionata non registrata");
console.log("/contatti: formula selezionata registrata correttamente");

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
  const state = { usersByEmail: new Map(), usersById: new Map(), sessions: new Map(), insertedUsers: 0, registrationBatchSize: 0, passwordHash: "" };
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
          if (sql.startsWith('DELETE FROM "Session" WHERE tokenHash=')) state.sessions.delete(this.values[0]);
          return { success: true };
        },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [] };
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

const registerResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: newEmail, nome: "Nuova Cliente", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: registration.db });
const firstCookie = registerResponse.headers.get("set-cookie")?.match(/^spl_session=([^;]+)/)?.[1];
if (registerResponse.status !== 303 || registerResponse.headers.get("location") !== "/studio" || !firstCookie || registration.state.insertedUsers !== 1 || registration.state.registrationBatchSize !== 2) throw new Error("Registrazione: creazione atomica di account e sessione non riuscita");
if (!registration.state.passwordHash.startsWith("pbkdf2$100000$")) throw new Error("Registrazione: hash password non compatibile con Cloudflare Workers");

const studioAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
const studioAfterRegistrationHtml = await studioAfterRegistration.text();
if (studioAfterRegistration.status !== 200 || !studioAfterRegistrationHtml.includes("Ciao, Nuova Cliente")) throw new Error("Registrazione: accesso immediato allo Studio non riuscito");

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
