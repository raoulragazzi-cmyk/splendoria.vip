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

for (const path of ["/", "/accedi", "/registrati", "/password-dimenticata", "/studio", "/admin", "/pagina-che-non-esiste"]) {
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
console.log("/formule: nuovo listino e selezione automatica disponibili");

const studioJs = await worker.fetch(new Request("https://www.splendoria.vip/assets/studio.js"), env);
const studioJsBody = await studioJs.text();
if (studioJs.status !== 200 || !studioJs.headers.get("content-type")?.includes("javascript") || !studioJsBody.includes("SpeechRecognition") || !studioJsBody.includes("data-plan-choice")) throw new Error("Asset JavaScript: funzionalità non valide");
console.log("/assets/studio.js: dettatura vocale e scelta formula disponibili");

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
const contactBody = new URLSearchParams({ fullName: "Mario Rossi", phone: "+39 000 000000", email: "mario@example.com", plan: "assisted", subject: "Vorrei informazioni", message: "Contattatemi, grazie." });
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
