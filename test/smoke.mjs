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

const accessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env)).text();
if (!accessHtml.includes('href="/area-clienti"') || !accessHtml.includes('href="/area-amministratore"') || !accessHtml.includes("Scegli la tua area")) throw new Error("Accesso: scelta tra area clienti e amministratore incompleta");
const clientAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env)).text();
if (!clientAccessHtml.includes('action="/area-clienti"') || !clientAccessHtml.includes("Accedi al tuo Studio")) throw new Error("Accesso clienti: schermata non valida");
const adminAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env)).text();
if (!adminAccessHtml.includes('action="/area-amministratore"') || !adminAccessHtml.includes("sblocco dei pagamenti")) throw new Error("Accesso amministratore: schermata non valida");
console.log("/accesso: schermate cliente e amministratore separate");

const showcaseTypography = await (await worker.fetch(new Request("https://www.splendoria.vip/"), env)).text();
if (!showcaseTypography.includes('class="showcase-page"') || !showcaseTypography.includes('font-family:"Gentium Book Plus"') || !showcaseTypography.includes("--showcase-title-size") || !showcaseTypography.includes("--showcase-text-size")) throw new Error("Vetrina: sistema tipografico Gentium Book Plus non applicato");
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/gentium-book-plus-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`Vetrina: font locale ${weight} non valido`);
}
console.log("/vetrina: Gentium Book Plus locale e due scale responsive disponibili");

const wranglerConfig = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
if (!wranglerConfig.includes('"database_name": "splendoria-db"') || !wranglerConfig.includes('"database_id": "1a46b8b0-2e6f-44cf-a22f-4950259f9434"') || !wranglerConfig.includes('"APP_URL": "https://www.splendoria.vip"')) throw new Error("Cloudflare: configurazione di produzione non valida");
if (wranglerConfig.includes('"database_name": "splendoria-v2-test"') || wranglerConfig.includes("splendoria-v2.raoulragazzi.workers.dev")) throw new Error("Cloudflare: riferimenti all’ambiente di test ancora attivi");
console.log("/configurazione: database e URL di produzione attivi");

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
if (!pricingHtml.includes("Via Settala 22–24, Milano (MI)")) throw new Error("Informazioni legali: indirizzo di Milano mancante");
if (!pricingHtml.includes('name="privacyRead"') || !pricingHtml.includes("Ho letto la")) throw new Error("Contatti: presa visione della Privacy Policy mancante");
console.log("/formule: nuovo listino e selezione automatica disponibili");

const legalChecks = [
  ["/privacy-policy", ["Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)", "Cloudflare Workers AI", "Diritti dell’interessato"]],
  ["/cookie-policy", ["Via Settala 22–24, Milano (MI)", "spl_session", "splendoria-voice-language", "non installa cookie pubblicitari"]],
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
          if (sql.includes('SELECT * FROM "User" WHERE email=')) return user;
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

const adminCredentials = credentialDb({ id: "legacy-admin", email: env.ADMIN_EMAIL, nome: "Raoul", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const adminLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: env.ADMIN_EMAIL, password: legacyPassword }) }), { ...env, DB: adminCredentials.db });
if (adminLogin.status !== 303 || adminLogin.headers.get("location") !== "/admin") throw new Error("Login: account amministratore storico non accettato");

const wrongAreaCredentials = credentialDb({ id: "client-role", email: "cliente@example.com", nome: "Cliente", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const wrongAreaLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: "cliente@example.com", password: legacyPassword }) }), { ...env, DB: wrongAreaCredentials.db });
const wrongAreaHtml = await wrongAreaLogin.text();
if (wrongAreaLogin.status !== 200 || !wrongAreaHtml.includes("non è autorizzato")) throw new Error("Login: separazione dei ruoli non applicata");
console.log("/login: account storici migrati e ruoli separati");

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
            if (sql.includes('SELECT id,email,nome FROM "User" WHERE email=')) return { id: "ulli-id", email: "ulli@apple.bz", nome: "Ulli" };
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
