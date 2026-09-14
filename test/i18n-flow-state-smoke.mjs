import worker from "../src/i18n-flow-worker.js";

const PASSWORD = "correct horse battery staple";

async function passwordHash(password) {
  const salt = "splendoria-test-salt";
  const iterations = 2;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations }, material, 256);
  const key = Array.from(new Uint8Array(bits), x => x.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$${iterations}$${salt}$${key}`;
}

const USER = {
  id: "flow-user",
  email: "maria@example.com",
  nome: "Maria",
  passwordHash: await passwordHash(PASSWORD),
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: "2026-01-02T10:00:00.000Z"
};

const BASE_PROJECT = {
  id: "flow-book",
  userId: USER.id,
  title: "Ricordi di famiglia",
  genre: "Autobiografia",
  targetPages: 84,
  plan: "free",
  status: "struttura_creata",
  tone: "Intimo e riflessivo",
  audience: "Famiglia",
  sourceMaterial: "Nel 1998 vivevamo a Bolzano con mia madre Maria e mio padre Marco. Ogni domenica pranzavamo insieme e parlavamo del lavoro, della scuola e dei nostri progetti.",
  story: "Ricordo la casa di famiglia, le domeniche insieme e le conversazioni che ci hanno accompagnato negli anni.",
  people: "Maria, Marco",
  events: "Il trasloco del 1998 e le domeniche in famiglia",
  message: "Conservare la memoria familiare",
  specialDataConsentAt: "2026-01-03T10:00:00.000Z",
  createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  updatedAt: "2026-01-03T10:00:00.000Z"
};

const CHAPTER = {
  id: "chapter-1",
  projectId: BASE_PROJECT.id,
  position: 1,
  title: "La casa di famiglia",
  content: "Ricordo la casa di famiglia e le domeniche trascorse insieme. Mia madre preparava il pranzo e noi parlavamo a lungo dei giorni appena trascorsi. Quel tavolo era il punto in cui ci ritrovavamo, raccontavamo il lavoro, la scuola e i piccoli progetti. Con il tempo ho capito quanto quei momenti semplici abbiano costruito la nostra memoria comune",
  status: "modificato",
  createdAt: "2026-01-03T10:00:00.000Z",
  updatedAt: "2026-01-03T10:00:00.000Z"
};

const LONG_MUSE_SECTION = Array.from({ length: 300 }, (_, index) => ["ricordo", "famiglia", "casa", "domenica", "insieme"][index % 5]).join(" ");

function snapshotFor(project, chapters) {
  return JSON.stringify({ project, chapters, interview: null, sections: [] });
}

function makeRuntime(options = {}) {
  const state = options.commercialState || "pagato";
  const project = { ...BASE_PROJECT, ...(options.project || {}) };
  const chapters = options.chapters === undefined ? [{ ...CHAPTER }] : options.chapters;
  const operations = [];
  const backup = options.backup === false ? null : {
    id: "backup-1",
    snapshotJson: snapshotFor(project, chapters),
    createdAt: "2026-09-13T12:00:00.000Z"
  };

  const DB = {
    prepare(sql = "") {
      let bindings = [];
      const statement = {
        sql,
        bindings,
        bind(...values) { bindings = values; this.bindings = values; return this; },
        async run() {
          operations.push({ type: "run", sql, bindings: [...bindings] });
          return { success: true, meta: { changes: 1 } };
        },
        async first() {
          operations.push({ type: "first", sql, bindings: [...bindings] });
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return options.withUser === false ? null : { ...USER };
          if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return options.owned === false ? null : { ...project };
          if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: state };
          if (sql.includes('SELECT id,userId,title,status FROM "BookProject"')) return options.owned === false ? null : { id: project.id, userId: project.userId, title: project.title, status: project.status };
          if (sql.includes('SELECT * FROM "BookProject" WHERE id=? AND userId=?')) return options.owned === false ? null : { ...project };
          if (sql.includes('SELECT id,title,position FROM "BookChapter" WHERE id=? AND projectId=?')) return chapters[0] ? { id: chapters[0].id, title: chapters[0].title, position: chapters[0].position } : null;
          if (sql.includes('SELECT * FROM "BookChapter" WHERE id=? AND projectId=?')) return chapters[0] ? { ...chapters[0] } : null;
          if (sql.includes('SELECT id,snapshotJson FROM "BookProjectBackup"')) return backup ? { id: backup.id, snapshotJson: backup.snapshotJson } : null;
          if (sql.includes('SELECT createdAt FROM "BookProjectBackup"')) return backup ? { createdAt: backup.createdAt } : null;
          if (sql.includes('SELECT COALESCE(SUM(requests),0) requests FROM "AiUsage"')) return { requests: options.aiUsage || 0 };
          if (sql.includes('FROM "BookInterview"')) return null;
          if (sql.includes('FROM "AuthThrottle"')) return null;
          if (sql.includes('SELECT COUNT(*)')) return { total: 0, projects: 1, orders: 0 };
          return null;
        },
        async all() {
          operations.push({ type: "all", sql, bindings: [...bindings] });
          if (sql.includes('FROM "BookChapter"')) return { results: chapters.map(item => ({ ...item })) };
          if (sql.includes('FROM "BookChapterSection"')) return { results: [] };
          if (sql.includes('FROM "Ordine"')) return { results: [] };
          return { results: [] };
        }
      };
      return statement;
    },
    async batch(statements) {
      for (const statement of statements || []) operations.push({ type: "batch", sql: statement?.sql || "", bindings: [...(statement?.bindings || [])] });
      return (statements || []).map(() => ({ success: true, meta: { changes: 1 } }));
    }
  };

  const env = {
    DB,
    APP_URL: "https://www.splendoria.vip",
    ADMIN_EMAIL: "raoulragazzi@gmail.com",
    EMAIL_FROM: "contatti@splendoria.vip",
    AI: {
      async run(_model, payload = {}) {
        const system = String(payload.messages?.[0]?.content || "");
        const user = String(payload.messages?.at(-1)?.content || "");
        if (system.includes("singola sezione di un capitolo autobiografico")) return { response: LONG_MUSE_SECTION };
        if (system.includes("Correggi esclusivamente") || system.includes("editor")) {
          const source = user.split("\n\n").at(-1)?.trim() || CHAPTER.content;
          return { response: source.endsWith(".") ? source : `${source}.` };
        }
        return { response: LONG_MUSE_SECTION };
      }
    }
  };
  return { env, operations, project, chapters, backup };
}

function send(runtime, path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.withUser !== false) headers.set("cookie", "spl_session=test-session");
  return worker.fetch(new Request(`https://www.splendoria.vip${path}`, { ...init, headers }), runtime.env);
}

function postForm(runtime, path, data, extra = {}) {
  return send(runtime, path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...(extra.headers || {}) },
    body: new URLSearchParams(data),
    withUser: extra.withUser
  });
}

function postJson(runtime, path, data, extra = {}) {
  return send(runtime, path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(extra.headers || {}) },
    body: JSON.stringify(data),
    withUser: extra.withUser
  });
}

function assertRedirect(response, expected, label) {
  if (response.status < 300 || response.status >= 400) throw new Error(`${label}: expected redirect, got ${response.status}`);
  if (response.headers.get("location") !== expected) throw new Error(`${label}: ${response.headers.get("location")} != ${expected}`);
}

const stateCases = [
  { name: "trial-active", state: "prova_gratuita", project: { plan: "free", createdAt: new Date(Date.now() - 2 * 864e5).toISOString() }, de: ["Kostenlose Testphase von 14 Tagen", "Erstelle dein erstes Kapitel kostenlos"], en: ["14-day free trial", "Create your first chapter for free"] },
  { name: "trial-expired", state: "prova_gratuita", project: { plan: "free", createdAt: new Date(Date.now() - 30 * 864e5).toISOString() }, de: ["Kostenlose Testphase beendet", "Die kostenlose Testphase ist beendet"], en: ["Free trial ended", "The free trial has ended"] },
  { name: "formula-selected", state: "formula_scelta", project: { plan: "digital" }, de: ["Das Programm wurde ausgewählt", "Überweisung wird geprüft"], en: ["Your programme has been selected", "Bank transfer awaiting verification"] },
  { name: "bank-pending", state: "da_pagare", project: { plan: "digital", status: "attesa_pagamento" }, de: ["Überweisung wird geprüft", "Bankdaten"], en: ["Bank transfer awaiting verification", "Bank transfer details"] },
  { name: "paid", state: "pagato", project: { plan: "digital" }, de: ["Vollständiges Buch", "Zahlung bestätigt"], en: ["Complete book", "Payment confirmed"] },
  { name: "free", state: "gratuito", project: { plan: "digital" }, de: ["Vollständiges Buch", "Kostenloser Zugang freigeschaltet"], en: ["Complete book", "Free access authorised"] },
  { name: "refunded", state: "rimborsato", project: { plan: "digital" }, de: ["Erstattet", "Das Programm wurde ausgewählt"], en: ["Refunded", "Your programme has been selected"] }
];

for (const testCase of stateCases) {
  for (const locale of ["de", "en"]) {
    const runtime = makeRuntime({ commercialState: testCase.state, project: testCase.project });
    const response = await send(runtime, `/${locale}/libro/flow-book`);
    const html = await response.text();
    if (response.status !== 200) throw new Error(`${testCase.name} ${locale}: status ${response.status}`);
    if (response.headers.get("content-language") !== locale) throw new Error(`${testCase.name} ${locale}: content-language lost`);
    for (const marker of testCase[locale]) if (!html.includes(marker)) throw new Error(`${testCase.name} ${locale}: missing ${marker}`);
    if (html.includes("Completa il libro") || html.includes("La prova gratuita è terminata")) throw new Error(`${testCase.name} ${locale}: Italian state residue`);
  }
}

for (const locale of ["de", "en"]) {
  const runtime = makeRuntime({ commercialState: "pagato" });
  const saved = await postForm(runtime, `/${locale}/libro/flow-book/capitolo/chapter-1/salva`, { title: CHAPTER.title, content: CHAPTER.content });
  assertRedirect(saved, `https://www.splendoria.vip/${locale}/libro/flow-book#chapter-card-chapter-1`, `save ${locale}`);

  const autosaved = await postJson(runtime, `/${locale}/libro/flow-book/capitolo/chapter-1/autosalva`, { title: CHAPTER.title, content: `${CHAPTER.content}.` });
  if (autosaved.status !== 200 || autosaved.headers.get("content-language") !== locale) throw new Error(`autosave ${locale}: bad response`);
  if (!(await autosaved.json()).ok) throw new Error(`autosave ${locale}: missing ok`);

  const generated = await postForm(runtime, `/${locale}/libro/flow-book/capitolo/chapter-1/genera`, { title: CHAPTER.title, content: CHAPTER.content });
  assertRedirect(generated, `https://www.splendoria.vip/${locale}/libro/flow-book#chapter-card-chapter-1`, `muse generate ${locale}`);

  const improved = await postForm(runtime, `/${locale}/libro/flow-book/capitolo/chapter-1/rifinisci`, { title: CHAPTER.title, content: CHAPTER.content, action: "improve" });
  assertRedirect(improved, `https://www.splendoria.vip/${locale}/libro/flow-book#chapter-card-chapter-1`, `improve ${locale}`);

  const grammar = await postForm(runtime, `/${locale}/libro/flow-book/capitolo/chapter-1/rifinisci`, { title: CHAPTER.title, content: CHAPTER.content, action: "grammar" });
  assertRedirect(grammar, `https://www.splendoria.vip/${locale}/libro/flow-book#chapter-card-chapter-1`, `grammar ${locale}`);

  const restored = await postForm(runtime, `/${locale}/libro/flow-book/ripristina`, {});
  if (restored.status < 300 || restored.status >= 400) throw new Error(`restore ${locale}: no redirect`);
  const restoreLocation = new URL(restored.headers.get("location"));
  if (restoreLocation.pathname !== `/${locale}/libro/flow-book`) throw new Error(`restore ${locale}: language lost`);
  const restoreMessage = restoreLocation.searchParams.get("e") || "";
  if (locale === "de" ? !restoreMessage.includes("wiederhergestellt") : !restoreMessage.includes("restored")) throw new Error(`restore ${locale}: notice not localized`);

  const deletion = await postForm(runtime, `/${locale}/libro/flow-book/elimina`, { password: PASSWORD, confirmation: "ELIMINA" });
  if (deletion.status < 300 || deletion.status >= 400) throw new Error(`delete ${locale}: no redirect`);
  const deletionLocation = new URL(deletion.headers.get("location"));
  if (deletionLocation.pathname !== `/${locale}/studio`) throw new Error(`delete ${locale}: language lost`);
  const deletionMessage = deletionLocation.searchParams.get("e") || "";
  if (locale === "de" ? !deletionMessage.includes("endgültig gelöscht") : !deletionMessage.includes("permanently deleted")) throw new Error(`delete ${locale}: notice not localized`);
}

{
  const runtime = makeRuntime({ commercialState: "prova_gratuita", project: { plan: "free" } });
  const purchased = await postForm(runtime, "/en/libro/flow-book/acquista", { plan: "digital", termsAccepted: "yes" });
  assertRedirect(purchased, "https://www.splendoria.vip/en/studio", "purchase transition");
  const setPending = runtime.operations.some(op => op.bindings.includes("da_pagare"));
  if (!setPending) throw new Error("purchase transition: da_pagare not persisted");
}

{
  const runtime = makeRuntime({ commercialState: "pagato", withUser: false });
  const expired = await postForm(runtime, "/de/libro/flow-book/capitolo/chapter-1/salva", { title: CHAPTER.title, content: CHAPTER.content }, { withUser: false });
  assertRedirect(expired, "https://www.splendoria.vip/de/area-clienti", "expired session");
}

{
  const runtime = makeRuntime({ commercialState: "pagato", owned: false });
  const foreign = await postForm(runtime, "/en/libro/foreign-book/capitolo/chapter-1/salva", { title: CHAPTER.title, content: CHAPTER.content });
  assertRedirect(foreign, "https://www.splendoria.vip/en/studio", "foreign book");
}

{
  const runtime = makeRuntime({ commercialState: "da_pagare", project: { plan: "digital", status: "attesa_pagamento" }, chapters: [{ ...CHAPTER, position: 2 }] });
  const lockedSave = await postForm(runtime, "/de/libro/flow-book/capitolo/chapter-1/salva", { title: CHAPTER.title, content: CHAPTER.content });
  const html = await lockedSave.text();
  if (lockedSave.status !== 200 || lockedSave.headers.get("content-language") !== "de") throw new Error("locked chapter: bad localized response");
  if (!html.includes("Dieses Kapitel ist dem vollständigen Buch vorbehalten")) throw new Error("locked chapter: German notice missing");
  if (!html.includes('action="/de/libro/flow-book')) throw new Error("locked chapter: localized actions lost");

  const lockedAutosave = await postJson(runtime, "/en/libro/flow-book/capitolo/chapter-1/autosalva", { title: CHAPTER.title, content: CHAPTER.content });
  if (lockedAutosave.status !== 403 || lockedAutosave.headers.get("content-language") !== "en") throw new Error("locked autosave: bad status/language");
  const lockedData = await lockedAutosave.json();
  if (!String(lockedData.error || "").startsWith("Chapter locked")) throw new Error("locked autosave: error not localized");
}

{
  const runtime = makeRuntime({ commercialState: "pagato" });
  const failedDelete = await postForm(runtime, "/en/libro/flow-book/elimina", { password: PASSWORD, confirmation: "NO" });
  const html = await failedDelete.text();
  if (failedDelete.status !== 200 || failedDelete.headers.get("content-language") !== "en") throw new Error("failed delete: bad localized response");
  if (!html.includes("To confirm, type ELIMINA exactly.")) throw new Error("failed delete: notice not localized");
  if (!html.includes('action="/en/libro/flow-book')) throw new Error("failed delete: localized editor namespace lost");
}

{
  const runtime = makeRuntime({ commercialState: "prova_gratuita", project: { plan: "free" } });
  const termsFailure = await postForm(runtime, "/de/libro/flow-book/acquista", { plan: "digital" });
  const html = await termsFailure.text();
  if (termsFailure.status !== 200 || termsFailure.headers.get("content-language") !== "de") throw new Error("terms failure: bad localized response");
  if (!html.includes("Um fortzufahren, musst du die Allgemeinen Geschäftsbedingungen akzeptieren.")) throw new Error("terms failure: German notice missing");
}

console.log("flow i18n: commercial states, save/autosave, Muse, improve, grammar, restore, delete, session/ownership/lock/failure namespace DE/EN verified");
