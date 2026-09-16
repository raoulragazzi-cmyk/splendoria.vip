import worker from "../src/studio-language-worker.js";
const USER = { id: "user-1", email: "anna@example.com", nome: "Anna", passwordHash: "hash", createdAt: "2026-01-01T10:00:00.000Z", emailVerifiedAt: "2026-01-02T10:00:00.000Z" };
const PROJECT = { id: "book-1", userId: USER.id, title: "La mia storia", genre: "Autobiografia", targetPages: 84, plan: "free", status: "bozza", tone: "Emozionante e autentico", audience: "", sourceMaterial: "", story: "", people: "", events: "", message: "", specialDataConsentAt: null, createdAt: "2026-01-01T10:00:00.000Z", updatedAt: "2026-01-01T10:00:00.000Z" };
const DB = { prepare(sql = "") { return { bind() { return this; }, async run() { return { success: true, meta: { changes: 1 } }; }, async first() { if (sql === "SELECT 1 AS ok") return { ok: 1 }; if (sql.includes('FROM "Session" s JOIN "User"')) return { ...USER }; if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return { ...PROJECT }; if (sql.includes('SELECT * FROM "BookInterview"')) return null; if (sql.includes('SELECT createdAt FROM "BookProjectBackup"')) return null; if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: "gratuito" }; return null; }, async all() { if (sql.includes('FROM "BookChapter"') || sql.includes('FROM "BookChapterSection"') || sql.includes('FROM "Ordine"')) return { results: [] }; return { results: [] }; } }; }, async batch(statements) { return statements.map(() => ({ success: true, meta: { changes: 1 } })); } };
const env = { DB, APP_URL: "https://www.splendoria.vip", ADMIN_EMAIL: "admin@example.invalid", EMAIL_FROM: "contatti@splendoria.vip", AI: { async run() { return { response: "ok" }; } } };
const response = await worker.fetch(new Request("https://www.splendoria.vip/libro/book-1", { headers: { cookie: "spl_session=test-session" } }), env);
if (response.status !== 200) throw new Error(`editor status ${response.status}`);
const html = await response.text();
for (const marker of ['<details class="book-settings-options">', '<summary>Impostazioni del libro</summary>', 'name="title"', 'name="tone"', 'name="audience"', 'name="targetPages"', 'data-book-language-panel', 'id="source-material-book-1"']) if (!html.includes(marker)) throw new Error(`editor hierarchy missing ${marker}`);
if (html.includes('data-editor-language-slot')) throw new Error('editor language slot was not replaced');
const detailsStart = html.indexOf('<details class="book-settings-options">');
const detailsEnd = html.indexOf('</details>', detailsStart);
for (const marker of ['name="title"', 'name="tone"', 'name="audience"', 'name="targetPages"', 'data-book-language-panel']) {
  const index = html.indexOf(marker);
  if (!(index > detailsStart && index < detailsEnd)) throw new Error(`editor setting is not inside progressive disclosure: ${marker}`);
}
if (!(html.indexOf('id="source-material-book-1"') > detailsEnd)) throw new Error('real source material is not primary after settings');
console.log('editor first step: book settings collapsed, source material remains primary');
