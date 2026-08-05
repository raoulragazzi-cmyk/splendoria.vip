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
