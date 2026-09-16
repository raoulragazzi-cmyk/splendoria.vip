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
for (const marker of ['La tua storia comincia qui', 'name="title"', 'name="genre"', '<summary>Personalizza la struttura</summary>', 'name="targetPages"', 'value="84" selected', 'data-book-language-panel']) {
  if (!html.includes(marker)) throw new Error(`first-book onboarding missing ${marker}`);
}
if ((html.match(/Personalizza la struttura/g) || []).length !== 1) throw new Error('first-book structure disclosure duplicated');
const genreIndex = html.indexOf('name="genre"');
const summaryIndex = html.indexOf('<summary>Personalizza la struttura</summary>');
const targetIndex = html.indexOf('name="targetPages"');
const detailsEnd = html.indexOf('</details>', summaryIndex);
const languageIndex = html.indexOf('data-book-language-panel');
if (!(genreIndex >= 0 && genreIndex < summaryIndex)) throw new Error('genre must remain visible before advanced structure options');
if (!(summaryIndex >= 0 && targetIndex > summaryIndex && detailsEnd > targetIndex)) throw new Error('structure selector is not contained in progressive disclosure');
if (!(languageIndex > detailsEnd)) throw new Error('book language must remain visible and independent from structure disclosure');
console.log('progressive first-book setup: genre/language visible, structure optional, 12-chapter default preserved');
