import worker from "../src/i18n-editor-safe-worker.js";

const USER = {
  id: "user-1",
  email: "anna@example.com",
  nome: "Anna",
  passwordHash: "hash",
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: "2026-01-02T10:00:00.000Z"
};

const PROJECT = {
  id: "book-1",
  userId: USER.id,
  title: "Titolo parole La tua Musa Come funziona",
  genre: "Autobiografia",
  targetPages: 84,
  plan: "free",
  status: "bozza",
  tone: "Emozionante e autentico",
  audience: "Famiglia e amici",
  sourceMaterial: "Dati reali Come funziona Titolo parole",
  story: "Titolo parole La tua Musa Come funziona. Questo testo dell'autrice non deve essere tradotto.",
  people: "Anna, Marco",
  events: "Un viaggio nel 1998",
  message: "Ricordare insieme",
  specialDataConsentAt: "2026-01-03T10:00:00.000Z",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-03T10:00:00.000Z"
};

function makeDb(withUser = true) {
  return {
    prepare(sql = "") {
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async run() { return { success: true, meta: { changes: 1 }, bindings }; },
        async first() {
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return withUser ? { ...USER } : null;
          if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return { ...PROJECT };
          if (sql.includes('SELECT * FROM "BookProject" WHERE id=? AND userId=?')) return { ...PROJECT };
          if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: "gratuito" };
          if (sql.includes('SELECT * FROM "BookInterview"')) return null;
          if (sql.includes('SELECT questions,answers FROM "BookInterview"')) return null;
          if (sql.includes('SELECT createdAt FROM "BookProjectBackup"')) return null;
          if (sql.includes('SELECT COUNT(*) total FROM "BookProject"')) return { total: 0 };
          if (sql.includes('(SELECT COUNT(*) FROM "BookProject"')) return { projects: 1, orders: 0 };
          return null;
        },
        async all() {
          if (sql.includes('FROM "BookChapter"')) return { results: [] };
          if (sql.includes('FROM "BookChapterSection"')) return { results: [] };
          if (sql.includes('FROM "Ordine"')) return { results: [] };
          return { results: [] };
        }
      };
    },
    async batch(statements) { return statements.map(() => ({ success: true, meta: { changes: 1 } })); }
  };
}

function env(withUser = true) {
  return {
    DB: makeDb(withUser),
    APP_URL: "https://www.splendoria.vip",
    ADMIN_EMAIL: "raoulragazzi@gmail.com",
    EMAIL_FROM: "contatti@splendoria.vip",
    AI: { async run() { return { response: "ok" }; } }
  };
}

const send = (path, init = {}, withUser = true) => {
  const headers = new Headers(init.headers || {});
  if (withUser) headers.set("cookie", "spl_session=test-session");
  return worker.fetch(new Request(`https://www.splendoria.vip${path}`, { ...init, headers }), env(withUser));
};

const post = (path, data, withUser = true) => send(path, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(data)
}, withUser);

const escapeHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const cases = {
  de: {
    markers: ["Deine Schreibreise", "Vorschau durchblättern", "Die Seele des Buches", "Bucheinstellungen", "Buchstruktur", "Deine Muse", "Fortschritt des Buches"],
    preview: ["Drucken öffnen / PDF speichern", "Persönliche Ausgabe", "Inhaltsverzeichnis"]
  },
  en: {
    markers: ["Your writing journey", "Browse preview", "The soul of the book", "Book settings", "Book structure", "Your Muse", "Book progress"],
    preview: ["Open print / Save PDF", "Personal edition", "Table of contents"]
  }
};

for (const [locale, expected] of Object.entries(cases)) {
  const editorResponse = await send(`/${locale}/libro/book-1`);
  const editor = await editorResponse.text();
  if (editorResponse.status !== 200) throw new Error(`editor ${locale}: status ${editorResponse.status}`);
  if (editorResponse.headers.get("content-language") !== locale) throw new Error(`editor ${locale}: content-language mancante`);
  if (!editorResponse.headers.get("cache-control")?.includes("no-store")) throw new Error(`editor ${locale}: pagina privata cacheabile`);
  if (editorResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error(`editor ${locale}: pagina privata indicizzabile`);
  for (const marker of [
    `<html lang="${locale}">`, ...expected.markers,
    `href="/${locale}/studio"`, `href="/${locale}/libro/book-1/anteprima"`,
    `action="/${locale}/libro/book-1/salva"`, `action="/${locale}/libro/book-1/struttura"`,
    `action="/${locale}/libro/book-1/intervista"`, `data-book-path="/${locale}/libro/book-1"`,
    `src="/assets/studio.js?`, `lang=${locale}`
  ]) if (!editor.includes(marker)) throw new Error(`editor ${locale}: manca ${marker}`);

  const authored = [PROJECT.title, PROJECT.sourceMaterial, PROJECT.story, PROJECT.people, PROJECT.events, PROJECT.message];
  for (const value of authored) {
    const preserved = editor.includes(value) || editor.includes(escapeHtml(value));
    if (!preserved) throw new Error(`editor ${locale}: contenuto autore alterato: ${value}`);
  }
  if (!editor.includes('value="Emozionante e autentico" selected')) throw new Error(`editor ${locale}: valore canonico tono non preservato`);
  if (editor.includes('action="/libro/book-1/salva"')) throw new Error(`editor ${locale}: azione salva esce dal namespace lingua`);

  const previewResponse = await send(`/${locale}/libro/book-1/anteprima`);
  const preview = await previewResponse.text();
  if (previewResponse.status !== 200 || previewResponse.headers.get("content-language") !== locale) throw new Error(`preview ${locale}: risposta non localizzata`);
  for (const marker of [...expected.preview, PROJECT.title, `href="/${locale}/studio"`]) {
    if (!preview.includes(marker)) throw new Error(`preview ${locale}: manca ${marker}`);
  }

  const saveResponse = await post(`/${locale}/libro/book-1/salva`, {
    title: PROJECT.title,
    tone: PROJECT.tone,
    audience: PROJECT.audience,
    sourceMaterial: PROJECT.sourceMaterial,
    story: PROJECT.story,
    people: PROJECT.people,
    events: PROJECT.events,
    message: PROJECT.message,
    targetPages: "84",
    specialDataConsent: "yes"
  });
  if (saveResponse.status < 300 || saveResponse.status >= 400) throw new Error(`editor ${locale}: save non redirige`);
  if (saveResponse.headers.get("location") !== `https://www.splendoria.vip/${locale}/libro/book-1`) throw new Error(`editor ${locale}: save perde la lingua: ${saveResponse.headers.get("location")}`);

  const anonymous = await send(`/${locale}/libro/book-1`, {}, false);
  if (anonymous.status < 300 || anonymous.status >= 400 || anonymous.headers.get("location") !== `https://www.splendoria.vip/${locale}/area-clienti`) throw new Error(`editor ${locale}: redirect anonimo errato`);

  const scriptResponse = await send(`/assets/studio.js?v=20260901-5&lang=${locale}`);
  const script = await scriptResponse.text();
  if (!script.includes("(?:de|en)")) throw new Error(`editor ${locale}: script non riconosce i pathname localizzati`);
  if (!script.includes("SPL_CLIENT_DRAFT_KEY") || !script.includes("replace(/^\\/(?:de|en)")) throw new Error(`editor ${locale}: chiave backup locale non normalizzata`);
}

const studio = await (await send("/de/studio")).text();
if (!studio.includes('action="/de/nuovo-libro"')) throw new Error("studio de: creazione nuovo libro non entra nel namespace lingua");

const create = await post("/en/nuovo-libro", { title: "My book", genre: "Autobiografia", targetPages: "84" });
if (create.status < 300 || create.status >= 400 || !create.headers.get("location")?.startsWith("https://www.splendoria.vip/en/libro/")) throw new Error("new book en: redirect localizzato mancante");

const adminLocalized = await send("/de/admin");
if (adminLocalized.status !== 404) throw new Error("editor: admin non deve essere localizzato");

console.log("editor i18n: editor, preview, save, new-book, script path e integrità contenuti autore DE/EN verificati");
