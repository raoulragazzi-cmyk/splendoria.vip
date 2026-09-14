import worker from "../src/i18n-commercial-worker.js";

const USER = {
  id: "user-commercial",
  email: "client@example.com",
  nome: "Maria",
  passwordHash: "hash",
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: "2026-01-02T10:00:00.000Z"
};

const PROJECT = {
  id: "book-commercial",
  userId: USER.id,
  title: "Libro di famiglia",
  genre: "Autobiografia",
  targetPages: 84,
  plan: "free",
  status: "bozza",
  tone: "Intimo e riflessivo",
  audience: "Famiglia",
  sourceMaterial: "Ricordi reali",
  story: "Una storia reale",
  people: "Maria",
  events: "1998",
  message: "Per la famiglia",
  specialDataConsentAt: "2026-01-03T10:00:00.000Z",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-03T10:00:00.000Z"
};

function makeDb() {
  return {
    prepare(sql = "") {
      return {
        bind() { return this; },
        async run() { return { success: true, meta: { changes: 1 } }; },
        async first() {
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return { ...USER };
          if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return { ...PROJECT };
          if (sql.includes('SELECT * FROM "BookProject" WHERE id=? AND userId=?')) return { ...PROJECT };
          if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: "formula_scelta" };
          if (sql.includes('SELECT * FROM "BookInterview"')) return null;
          if (sql.includes('SELECT questions,answers FROM "BookInterview"')) return null;
          if (sql.includes('SELECT createdAt FROM "BookProjectBackup"')) return null;
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

const env = {
  DB: makeDb(),
  APP_URL: "https://www.splendoria.vip",
  ADMIN_EMAIL: "raoulragazzi@gmail.com",
  EMAIL_FROM: "contatti@splendoria.vip",
  AI: { async run() { return { response: "ok" }; } }
};

const send = path => worker.fetch(new Request(`https://www.splendoria.vip${path}`, {
  headers: { cookie: "spl_session=test-session" }
}), env);

const cases = {
  de: [
    "Buch vervollständigen",
    "Wähle das passende Programm, um fortzufahren",
    "Bankdaten",
    "Kontoinhaber:",
    "Programm zur Freischaltung auswählen",
    "Bis zu 100 Seiten · 12 Kapitel",
    "Bis zu 120 Seiten · 18 Kapitel",
    "Empfohlener Verwendungszweck: Splendoria · Libro di famiglia",
    "Ich habe die"
  ],
  en: [
    "Complete the book",
    "Choose a programme to continue",
    "Bank transfer details",
    "Account holder:",
    "Choose the programme to unlock",
    "Up to 100 pages · 12 chapters",
    "Up to 120 pages · 18 chapters",
    "Suggested payment reference: Splendoria · Libro di famiglia",
    "I have read and accept the"
  ]
};

for (const [locale, markers] of Object.entries(cases)) {
  const response = await send(`/${locale}/libro/book-commercial`);
  const html = await response.text();
  if (response.status !== 200 || response.headers.get("content-language") !== locale) throw new Error(`commercial ${locale}: risposta non localizzata`);
  for (const marker of markers) if (!html.includes(marker)) throw new Error(`commercial ${locale}: manca ${marker}`);
  for (const residual of [
    "Completa il libro",
    "Scegli la formula per continuare",
    "Dati per il bonifico",
    "Intestatario:",
    "Scegli la formula da sbloccare",
    "Fino a 100 pagine · 12 capitoli",
    "Causale consigliata: Splendoria"
  ]) if (html.includes(residual)) throw new Error(`commercial ${locale}: residuo italiano ${residual}`);
  if (!html.includes(`action="/${locale}/libro/book-commercial/acquista"`)) throw new Error(`commercial ${locale}: acquisto esce dal namespace lingua`);
  if (!html.includes(`href="/${locale}/termini-condizioni"`)) throw new Error(`commercial ${locale}: termini escono dal namespace lingua`);
  if (!html.includes(PROJECT.title)) throw new Error(`commercial ${locale}: titolo autore alterato`);
}

console.log("commercial i18n: formule, bonifico, termini e namespace acquisto DE/EN verificati");
