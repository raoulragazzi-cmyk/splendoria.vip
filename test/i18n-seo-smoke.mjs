import worker from "../src/i18n-entry-worker.js";

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
const env = {
  DB,
  APP_URL: "https://www.splendoria.vip",
  ADMIN_EMAIL: "raoulragazzi@gmail.com",
  EMAIL_FROM: "contatti@splendoria.vip",
  AI: { async run() { return { response: "ok" }; } }
};
const request = (path, method = "GET") => worker.fetch(new Request(`https://www.splendoria.vip${path}`, { method }), env);
const publicPaths = ["/", "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"];
const localized = (locale, path) => path === "/" ? `/${locale}/` : `/${locale}${path}`;

const sitemapResponse = await request("/sitemap.xml");
const sitemap = await sitemapResponse.text();
if (sitemapResponse.status !== 200 || !sitemapResponse.headers.get("content-type")?.includes("xml")) throw new Error("seo: sitemap non valida");
if (!sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) throw new Error("seo: namespace xhtml mancante dalla sitemap multilingua");
for (const basePath of publicPaths) {
  for (const locale of ["it", "de", "en"]) {
    const path = locale === "it" ? basePath : localized(locale, basePath);
    const loc = `<loc>https://www.splendoria.vip${path}</loc>`;
    if (!sitemap.includes(loc)) throw new Error(`seo: URL localizzata assente dalla sitemap: ${path}`);
  }
  const altIt = `hreflang="it" href="https://www.splendoria.vip${basePath}"`;
  const altDe = `hreflang="de" href="https://www.splendoria.vip${localized("de", basePath)}"`;
  const altEn = `hreflang="en" href="https://www.splendoria.vip${localized("en", basePath)}"`;
  const xDefault = `hreflang="x-default" href="https://www.splendoria.vip${basePath}"`;
  for (const marker of [altIt, altDe, altEn, xDefault]) if (!sitemap.includes(marker)) throw new Error(`seo: alternate sitemap mancante per ${basePath}: ${marker}`);
}
for (const forbidden of ["/registrati", "/accedi", "/area-clienti", "/area-amministratore", "/admin", "/studio", "/api/"]) {
  if (sitemap.includes(`<loc>https://www.splendoria.vip${forbidden}`)) throw new Error(`seo: route privata indicizzata in sitemap: ${forbidden}`);
}

const robotsResponse = await request("/robots.txt");
const robots = await robotsResponse.text();
if (robotsResponse.status !== 200 || !robots.includes("Sitemap: https://www.splendoria.vip/sitemap.xml")) throw new Error("seo: robots.txt non collega la sitemap canonica");
for (const rule of ["Disallow: /registrati", "Disallow: /accedi", "Disallow: /area-clienti", "Disallow: /area-amministratore", "Disallow: /admin", "Disallow: /api/"]) {
  if (!robots.includes(rule)) throw new Error(`seo: robots.txt non protegge ${rule}`);
}

for (const locale of ["de", "en"]) {
  const bareHead = await request(`/${locale}`, "HEAD");
  if (bareHead.status !== 308 || bareHead.headers.get("location") !== `https://www.splendoria.vip/${locale}/`) throw new Error(`seo: HEAD /${locale} non segue il redirect canonico`);

  for (const basePath of publicPaths) {
    const path = localized(locale, basePath);
    const getResponse = await request(path);
    const headResponse = await request(path, "HEAD");
    if (headResponse.status !== getResponse.status) throw new Error(`seo: HEAD status diverso da GET per ${path}`);
    if (headResponse.headers.get("content-language") !== locale) throw new Error(`seo: HEAD Content-Language errato per ${path}`);
    if (await headResponse.text()) throw new Error(`seo: HEAD contiene body per ${path}`);
  }
}

console.log("seo i18n: sitemap multilingua, robots e HEAD semantics verificati");
