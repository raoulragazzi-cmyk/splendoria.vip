import worker from "../src/studio-language-worker.js";
const USER = { id: "user-1", email: "anna@example.com", nome: "Anna", passwordHash: "hash", createdAt: "2026-01-01T10:00:00.000Z", emailVerifiedAt: "2026-01-02T10:00:00.000Z" };
const DB = {
  prepare(sql = "") { return {
    bind() { return this; },
    async run() { return { success: true, meta: { changes: 1 } }; },
    async first() {
      if (sql === "SELECT 1 AS ok") return { ok: 1 };
      if (sql.includes('FROM "Session" s JOIN "User"')) return { ...USER };
      if (sql.includes('SELECT COUNT(*) total FROM "BookProject"')) return { total: 0 };
      return null;
    },
    async all() {
      if (sql.includes('FROM "BookProject" p LEFT JOIN "BookChapter"')) return { results: [] };
      if (sql.includes('SELECT c.projectId,c.content')) return { results: [] };
      return { results: [] };
    }
  }; },
  async batch(statements) { return statements.map(() => ({ success: true, meta: { changes: 1 } })); }
};
const env = { DB, APP_URL: "https://www.splendoria.vip", ADMIN_EMAIL: "admin@example.invalid", EMAIL_FROM: "contatti@splendoria.vip", AI: { async run() { return { response: "ok" }; } } };
const response = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: "spl_session=test-session" } }), env);
if (response.status !== 200) throw new Error(`first-book studio status ${response.status}`);
const html = await response.text();
for (const marker of ['data-first-book', 'value="La mia storia"', '<summary>Personalizza genere e struttura</summary>', 'name="genre"', 'name="targetPages"', 'value="84" selected', 'data-book-language-panel', 'Inizia il mio libro']) if (!html.includes(marker)) throw new Error(`first-book onboarding missing ${marker}`);
if (html.includes('data-first-book-language-slot')) throw new Error('first-book language placeholder was not replaced');
if ((html.match(/La tua storia comincia qui/g) || []).length !== 1) throw new Error('first-book empty state is duplicated');
const summaryIndex = html.indexOf('<summary>Personalizza genere e struttura</summary>');
const genreIndex = html.indexOf('name="genre"');
const languageIndex = html.indexOf('data-book-language-panel');
const detailsEnd = html.indexOf('</details>', summaryIndex);
if (!(summaryIndex >= 0 && genreIndex > summaryIndex && languageIndex > summaryIndex && detailsEnd > languageIndex)) throw new Error('advanced first-book controls are not contained in progressive disclosure');
console.log('first-book onboarding: one-click default path with optional advanced settings preserved');
