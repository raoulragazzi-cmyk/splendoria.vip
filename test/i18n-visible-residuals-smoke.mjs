import worker from "../src/german-editorial-room-worker.js";

const USER = {
  id: "qa-user",
  email: "qa@example.com",
  nome: "Anna",
  passwordHash: "hash",
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: "2026-01-02T10:00:00.000Z"
};

const PROJECT = {
  id: "qa-book",
  userId: USER.id,
  title: "Project Aurora",
  genre: "Autobiografia",
  targetPages: 84,
  plan: "digital",
  status: "struttura_creata",
  tone: "Intimo e riflessivo",
  audience: "Family",
  sourceMaterial: "Source material in English for QA only.",
  story: "A neutral authored story used only to verify that interface copy is localised.",
  people: "Anna, Marco",
  events: "A family move in 1998",
  message: "Preserve family memories",
  specialDataConsentAt: "2026-01-03T10:00:00.000Z",
  createdAt: "2026-01-03T10:00:00.000Z",
  updatedAt: "2026-01-03T10:00:00.000Z"
};

const CHAPTER = {
  id: "qa-chapter",
  projectId: PROJECT.id,
  position: 1,
  title: "Chapter Alpha",
  content: "Neutral authored chapter content for localisation QA.",
  status: "modificato",
  createdAt: "2026-01-03T10:00:00.000Z",
  updatedAt: "2026-01-03T10:00:00.000Z"
};

function makeDb() {
  return {
    prepare(sql = "") {
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async run() { return { success: true, meta: { changes: 1 }, bindings }; },
        async first() {
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return { ...USER };
          if (sql.includes('(SELECT COUNT(*) FROM "BookProject"')) return { projects: 1, orders: 0 };
          if (sql.includes('SELECT COUNT(*) total FROM "BookProject"')) return { total: 1 };
          if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return { ...PROJECT };
          if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: "pagato" };
          if (sql.includes('SELECT id,userId,title,status FROM "BookProject"')) return { id: PROJECT.id, userId: PROJECT.userId, title: PROJECT.title, status: PROJECT.status };
          if (sql.includes('SELECT * FROM "BookProject" WHERE id=? AND userId=?')) return { ...PROJECT };
          if (sql.includes('SELECT id,title,position FROM "BookChapter" WHERE id=? AND projectId=?')) return { id: CHAPTER.id, title: CHAPTER.title, position: CHAPTER.position };
          if (sql.includes('SELECT * FROM "BookChapter" WHERE id=? AND projectId=?')) return { ...CHAPTER };
          if (sql.includes('SELECT COALESCE(SUM(requests),0) requests FROM "AiUsage"')) return { requests: 0 };
          if (sql.includes('FROM "BookInterview"')) return null;
          if (sql.includes('FROM "AuthThrottle"')) return null;
          if (sql.includes('SELECT id,snapshotJson FROM "BookProjectBackup"')) return null;
          if (sql.includes('SELECT createdAt FROM "BookProjectBackup"')) return null;
          return null;
        },
        async all() {
          if (sql.includes('FROM "BookProject" p LEFT JOIN "BookChapter"')) return { results: [{ ...PROJECT, chapterCount: 1 }] };
          if (sql.includes('SELECT c.projectId,c.content')) return { results: [{ projectId: PROJECT.id, content: CHAPTER.content }] };
          if (sql.includes('FROM "BookChapter"')) return { results: [{ ...CHAPTER }] };
          if (sql.includes('FROM "BookChapterSection"')) return { results: [] };
          if (sql.includes('FROM "Ordine"')) return { results: [] };
          return { results: [] };
        }
      };
    },
    async batch(statements) { return (statements || []).map(() => ({ success: true, meta: { changes: 1 } })); }
  };
}

const env = {
  DB: makeDb(),
  APP_URL: "https://www.splendoria.vip",
  ADMIN_EMAIL: "raoulragazzi@gmail.com",
  EMAIL_FROM: "contatti@splendoria.vip",
  AI: { async run() { return { response: "Neutral generated text for QA." }; } }
};

function request(path, withSession = false) {
  const headers = new Headers();
  if (withSession) headers.set("cookie", "spl_session=qa-session");
  return worker.fetch(new Request(`https://www.splendoria.vip${path}`, { headers }), env);
}

function visibleText(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const PUBLIC_ROUTES = [
  "/",
  "/guida",
  "/privacy-policy",
  "/cookie-policy",
  "/termini-condizioni",
  "/note-legali",
  "/trasparenza-ai",
  "/registrati",
  "/area-clienti",
  "/password-dimenticata",
  "/percorso-inesistente-qa"
];

const PRIVATE_ROUTES = [
  "/studio",
  "/account",
  "/libro/qa-book",
  "/libro/qa-book/anteprima"
];

const HIGH_SIGNAL_ITALIAN = [
  /\bAccedi\b/,
  /\bRegistrati\b/,
  /Crea un nuovo libro/,
  /Titolo di lavoro/,
  /Torna allo Studio/,
  /Il mio account/,
  /Profilo e privacy/,
  /Password dimenticata/,
  /Mostra password/,
  /Nascondi password/,
  /Percorso guidato/,
  /Apri la guida completa/,
  /Affidati alla Musa/,
  /Correggi grammatica/,
  /\bMigliora\b/,
  /Salva capitolo/,
  /Ripristina/,
  /Elimina libro/,
  /Anteprima del libro/,
  /Prova gratuita conclusa/,
  /La prova gratuita è terminata/,
  /Crea gratuitamente il tuo primo capitolo/,
  /Scegli la formula/,
  /Bonifico in attesa di verifica/,
  /Dati per il bonifico/,
  /Termini e condizioni/,
  /Capitolo \d+ · bloccato/,
  /Richiede sblocco/,
  /pagine stimate/,
  /parole raccolte/,
  /Pagina non trovata/,
  /Torna alla home/,
  /DAMMI ALTRI DATI E FATTI/,
  /Più realtà mi affidi, più il racconto sarà tuo/,
  /Inserisci qui la maggiore quantità possibile di materiale concreto/,
  /Racconta liberamente la storia/,
  /La Musa diventa la tua giornalista personale/,
  /Guida digitale, sensibilità umana/
];

const EXPECTED_MARKERS = {
  de: ["Splendoria", "Mein Studio", "Mein Konto", "Seite nicht gefunden"],
  en: ["Splendoria", "My Studio", "My account", "Page not found"]
};

for (const locale of ["de", "en"]) {
  const pages = [];
  for (const route of PUBLIC_ROUTES) {
    const response = await request(`/${locale}${route === "/" ? "/" : route}`);
    if (![200, 404].includes(response.status)) throw new Error(`${locale} ${route}: unexpected status ${response.status}`);
    const html = await response.text();
    if (response.headers.get("content-language") !== locale) throw new Error(`${locale} ${route}: missing content-language`);
    pages.push({ route, text: visibleText(html), html });
  }
  for (const route of PRIVATE_ROUTES) {
    const response = await request(`/${locale}${route}`, true);
    if (response.status !== 200) throw new Error(`${locale} ${route}: unexpected status ${response.status}`);
    if (response.headers.get("content-language") !== locale) throw new Error(`${locale} ${route}: missing content-language`);
    if (!response.headers.get("cache-control")?.includes("no-store")) throw new Error(`${locale} ${route}: private page is cacheable`);
    pages.push({ route, text: visibleText(await response.text()) });
  }

  const combined = pages.map(page => `${page.route}\n${page.text}`).join("\n");
  for (const residual of HIGH_SIGNAL_ITALIAN) {
    const match = combined.match(residual);
    if (match) throw new Error(`${locale}: visible Italian residual matched ${residual}: ${match[0]}`);
  }

  for (const marker of EXPECTED_MARKERS[locale]) {
    if (!combined.includes(marker)) throw new Error(`${locale}: expected localized marker missing: ${marker}`);
  }

  for (const authored of [PROJECT.title, CHAPTER.title]) {
    if (!combined.includes(authored)) throw new Error(`${locale}: authored title disappeared: ${authored}`);
  }
}

console.log("visible residual i18n: representative public, auth, client, editor, preview and 404 pages contain no high-signal Italian UI copy in DE/EN");
