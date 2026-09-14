import worker from "../src/i18n-notfound-worker.js";

const env = {
  DB: {
    prepare(sql = "") {
      return {
        bind() { return this; },
        async first() { if (sql === "SELECT 1 AS ok") return { ok: 1 }; return null; },
        async all() { return { results: [] }; },
        async run() { return { success: true, meta: { changes: 0 } }; }
      };
    },
    async batch() { return []; }
  },
  APP_URL: "https://www.splendoria.vip",
  ADMIN_EMAIL: "raoulragazzi@gmail.com",
  EMAIL_FROM: "contatti@splendoria.vip",
  AI: { async run() { throw new Error("AI must not be reached by 404 test"); } }
};

const expected = {
  de: ["Seite nicht gefunden", "Diese Seite ist nicht verfügbar", "Zur Startseite", "Zum Studio"],
  en: ["Page not found", "This page is unavailable", "Back to home", "Go to Studio"]
};

for (const locale of ["de", "en"]) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/pagina-che-non-esiste`), env);
  if (response.status !== 404) throw new Error(`404 ${locale}: status ${response.status}`);
  if (response.headers.get("content-language") !== locale) throw new Error(`404 ${locale}: content-language lost`);
  if (!response.headers.get("cache-control")?.includes("no-store")) throw new Error(`404 ${locale}: response cacheable`);
  if (response.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error(`404 ${locale}: response indexable`);
  const html = await response.text();
  if (!html.includes(`<html lang="${locale}">`)) throw new Error(`404 ${locale}: html lang missing`);
  for (const marker of expected[locale]) if (!html.includes(marker)) throw new Error(`404 ${locale}: missing ${marker}`);
  if (!html.includes(`href="/${locale}/"`) || !html.includes(`href="/${locale}/studio"`)) throw new Error(`404 ${locale}: recovery links leave locale`);

  const head = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/pagina-che-non-esiste`, { method: "HEAD" }), env);
  if (head.status !== 404 || head.headers.get("content-language") !== locale) throw new Error(`404 HEAD ${locale}: semantics lost`);
  if ((await head.text()) !== "") throw new Error(`404 HEAD ${locale}: unexpected body`);
}

const italian = await worker.fetch(new Request("https://www.splendoria.vip/pagina-che-non-esiste"), env);
if (italian.status !== 404) throw new Error("404 IT: canonical behavior changed");

console.log("not-found i18n: DE/EN 404 copy, headers, recovery links and HEAD semantics verified; IT untouched");
