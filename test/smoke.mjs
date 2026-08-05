import worker from "../src/worker.js";

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

for (const path of ["/", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai", "/accedi", "/registrati", "/password-dimenticata", "/studio", "/admin", "/pagina-che-non-esiste"]) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  if (![200, 303, 404].includes(response.status)) throw new Error(`${path}: stato ${response.status}`);
  if (response.status === 200 && !(await response.text()).includes("Splendoria")) throw new Error(`${path}: HTML non valido`);
  console.log(`${path}: ${response.status}`);
}

const pricingResponse = await worker.fetch(new Request("https://www.splendoria.vip/?formula=complete"), env);
const pricingHtml = await pricingResponse.text();
if (!pricingHtml.includes("Splendoria Digital") || !pricingHtml.includes("Splendoria Premium") || !pricingHtml.includes("Splendoria Signature")) throw new Error("Listino: formule mancanti");
if (!pricingHtml.includes("1.500 €") || !pricingHtml.includes("10 copie cartacee comprese nel prezzo")) throw new Error("Listino: prezzi o contenuti principali non validi");
if (!pricingHtml.includes('<option value="complete" selected>Splendoria Premium</option>')) throw new Error("Listino: formula Premium non riportata nel form");
if (pricingHtml.includes("Hybrid") || pricingHtml.includes("Premium Short Book") || pricingHtml.includes("Personal Branding &amp; Corporate")) throw new Error("Listino: denominazioni precedenti ancora presenti");
if (pricingHtml.includes("prime 5 copie") || pricingHtml.includes("consegna entro 10 giorni")) throw new Error("Listino: promesse della precedente offerta ancora presenti");
if (!pricingHtml.includes("Le copie stampate seguono la formula scelta") || !pricingHtml.includes("riservato ai progetti Signature")) throw new Error("Listino: servizi inclusi o nota Signature non allineati");
if (!pricingHtml.includes("Partita IVA 02950290219") || !pricingHtml.includes('href="/privacy-policy"') || !pricingHtml.includes('href="/cookie-policy"')) throw new Error("Informazioni legali: P.IVA o collegamenti del footer mancanti");
if (pricingHtml.includes("Merano") || pricingHtml.includes("Via J. W. von Goethe")) throw new Error("Informazioni legali: vecchio indirizzo ancora presente");
if (!pricingHtml.includes('name="privacyRead"') || !pricingHtml.includes("Ho letto la")) throw new Error("Contatti: presa visione della Privacy Policy mancante");
console.log("/formule: nuovo listino e selezione automatica disponibili");

const legalChecks = [
  ["/privacy-policy", ["Raoul Ragazzi", "02950290219", "Cloudflare Workers AI", "Diritti dell’interessato"]],
  ["/cookie-policy", ["spl_session", "splendoria-voice-language", "non installa cookie pubblicitari"]],
  ["/termini-condizioni", ["Diritto di recesso", "Termini e condizioni", "conferma scritta di Splendoria"]],
  ["/note-legali", ["Note legali", "Raoul Ragazzi", "02950290219"]],
  ["/trasparenza-ai", ["Stai interagendo con un sistema di intelligenza artificiale", "supervisione umana"]]
];
for (const [path, expected] of legalChecks) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  const html = await response.text();
  if (response.status !== 200 || expected.some(text => !html.includes(text))) throw new Error(`${path}: informativa incompleta`);
}
const registrationResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati"), env);
const registrationHtml = await registrationResponse.text();
if (!registrationHtml.includes('name="privacyRead"') || !registrationHtml.includes('href="/privacy-policy"')) throw new Error("Registrazione: presa visione della Privacy Policy mancante");
console.log("/informative: pagine, footer e prese visione legali disponibili");

const studioJs = await worker.fetch(new Request("https://www.splendoria.vip/assets/studio.js"), env);
const studioJsBody = await studioJs.text();
if (studioJs.status !== 200 || !studioJs.headers.get("content-type")?.includes("javascript") || !studioJsBody.includes("SpeechRecognition") || !studioJsBody.includes("data-plan-choice") || !studioJsBody.includes("data-print-book") || !studioJsBody.includes("window.print()")) throw new Error("Asset JavaScript: funzionalità non valide");
if (!studioJsBody.includes("it-IT") || !studioJsBody.includes("de-DE") || !studioJsBody.includes("en-GB") || !studioJsBody.includes("splendoria-voice-language")) throw new Error("Asset JavaScript: lingue della dettatura non valide");
console.log("/assets/studio.js: dettatura trilingue e scelta formula disponibili");

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
console.log("/anteprima: stampa PDF tascabile 110 × 180 mm disponibile");

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

await expectRedirect("/admin", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/accedi");
await expectRedirect("/libro/progetto-di-un-altro", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/studio");
await expectRedirect("/admin/progetto/progetto-1/anteprima", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/accedi");
await expectRedirect("/studio", { id: "admin-1", email: "raoulragazzi@gmail.com", nome: "Admin" }, "/admin");
