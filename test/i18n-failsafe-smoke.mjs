import worker from "../src/i18n-failsafe-worker.js";

function brokenEnv() {
  return {
    DB: {
      prepare() { throw new Error("simulated database outage"); }
    },
    APP_URL: "https://www.splendoria.vip",
    ADMIN_EMAIL: "raoulragazzi@gmail.com",
    EMAIL_FROM: "contatti@splendoria.vip",
    AI: { async run() { throw new Error("AI should not be reached"); } }
  };
}

for (const locale of ["de", "en"]) {
  const htmlResponse = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/libro/failure-book/capitolo/failure-chapter/salva`, {
    method: "POST",
    headers: {
      cookie: "spl_session=broken-session",
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ title: "Test", content: "Test content" })
  }), brokenEnv());

  if (htmlResponse.status !== 500) throw new Error(`hard failure ${locale}: expected 500 HTML`);
  if (htmlResponse.headers.get("content-language") !== locale) throw new Error(`hard failure ${locale}: language header lost`);
  if (!htmlResponse.headers.get("cache-control")?.includes("no-store")) throw new Error(`hard failure ${locale}: error page cacheable`);
  if (htmlResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error(`hard failure ${locale}: error page indexable`);
  const html = await htmlResponse.text();
  if (!html.includes(`<html lang="${locale}">`)) throw new Error(`hard failure ${locale}: html lang lost`);
  if (!html.includes(`href="/${locale}/studio"`)) throw new Error(`hard failure ${locale}: recovery link leaves locale`);
  if (locale === "de" && !html.includes("Vorübergehendes Problem")) throw new Error("hard failure de: copy not localized");
  if (locale === "en" && !html.includes("Temporary problem")) throw new Error("hard failure en: copy not localized");

  const jsonResponse = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/libro/failure-book/capitolo/failure-chapter/autosalva`, {
    method: "POST",
    headers: {
      cookie: "spl_session=broken-session",
      "content-type": "application/json"
    },
    body: JSON.stringify({ title: "Test", content: "Test content" })
  }), brokenEnv());

  if (jsonResponse.status !== 500) throw new Error(`hard JSON failure ${locale}: expected 500`);
  if (jsonResponse.headers.get("content-language") !== locale) throw new Error(`hard JSON failure ${locale}: language header lost`);
  if (!(jsonResponse.headers.get("content-type") || "").includes("application/json")) throw new Error(`hard JSON failure ${locale}: JSON contract lost`);
  const data = await jsonResponse.json();
  if (!data.error) throw new Error(`hard JSON failure ${locale}: missing localized error`);
  if (locale === "de" && !data.error.includes("vorübergehenden Problem")) throw new Error("hard JSON failure de: copy not localized");
  if (locale === "en" && !data.error.includes("temporary problem")) throw new Error("hard JSON failure en: copy not localized");
}

console.log("failsafe i18n: hard HTML/JSON backend failures preserve DE/EN namespace, headers and recovery path");
