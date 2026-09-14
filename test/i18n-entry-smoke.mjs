import worker from "../src/i18n-entry-worker.js";

const DB = {
  prepare(sql = "") { return { bind() { return this; }, async run() { return { success: true }; }, async first() { return sql === "SELECT 1 AS ok" ? { ok: 1 } : null; }, async all() { return { results: [] }; } }; },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const env = { DB, APP_URL: "https://www.splendoria.vip", ADMIN_EMAIL: "raoulragazzi@gmail.com", EMAIL_FROM: "contatti@splendoria.vip", AI: { async run() { return { response: "ok" }; } } };
const get = path => worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);

for (const locale of ["de", "en"]) {
  const home = await get(`/${locale}/`);
  const homeHtml = await home.text();
  if (home.status !== 200 || !homeHtml.includes(`href="/${locale}/privacy-policy"`) || !homeHtml.includes(`href="/${locale}/guida"`)) throw new Error(`entry ${locale}: home non mantiene i link pubblici nella lingua`);

  const guide = await get(`/${locale}/guida`);
  const guideHtml = await guide.text();
  if (guide.status !== 200 || !guideHtml.includes(`href="/${locale}/privacy-policy"`) || !guideHtml.includes(`href="/${locale}/trasparenza-ai"`)) throw new Error(`entry ${locale}: guida non mantiene i link pubblici nella lingua`);

  const privacy = await get(`/${locale}/privacy-policy`);
  if (privacy.status !== 200) throw new Error(`entry ${locale}: privacy localizzata non raggiungibile`);

  const admin = await get(`/${locale}/admin`);
  if (admin.status !== 404) throw new Error(`entry ${locale}: area admin localizzata non deve esistere`);
}

console.log("i18n entry: composizione pubblica coerente e admin escluso");
