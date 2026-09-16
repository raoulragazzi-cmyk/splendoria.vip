import worker from "../src/worker.js";

const DB = {
  prepare(sql = "") {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async first() { return sql === "SELECT 1 AS ok" ? { ok: 1 } : null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const env = { DB, APP_URL: "https://www.splendoria.vip", ADMIN_EMAIL: "admin@example.invalid", EMAIL_FROM: "contatti@splendoria.vip", AI: { async run() { return { response: "ok" }; } } };

const choice = await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env);
if (choice.status !== 303 || choice.headers.get("location") !== "/area-clienti") throw new Error("anonymous /accedi must redirect to /area-clienti");
if (choice.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive" || !choice.headers.get("cache-control")?.includes("no-store")) throw new Error("/accedi redirect must preserve private-route headers");
const client = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env);
if (client.status !== 200) throw new Error("client login route changed unexpectedly");
const clientHtml = await client.text();
if (!clientHtml.includes('action="/area-clienti"') || clientHtml.includes('href="/accedi"') || clientHtml.includes('Scegli un’altra area')) throw new Error("client login contains obsolete area-choice navigation");
const forgot = await worker.fetch(new Request("https://www.splendoria.vip/password-dimenticata"), env);
const forgotHtml = await forgot.text();
if (!forgotHtml.includes('href="/area-clienti"') || !forgotHtml.includes('Torna all\u2019accesso') || forgotHtml.includes('Torna alla scelta dell\u2019area')) throw new Error("password recovery back-link is not client-first");
const admin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env);
if (admin.status !== 200 || !(await admin.text()).includes('action="/area-amministratore"')) throw new Error("direct admin login route changed unexpectedly");
console.log("client-first access: anonymous choice removed; client/admin direct routes preserved");
