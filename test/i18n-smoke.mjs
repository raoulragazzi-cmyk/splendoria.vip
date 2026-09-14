import worker from "../src/i18n-guard-worker.js";

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
  AI: { async run() { return { response: "Le radici\nLa svolta\nIl futuro\nEpilogo" }; } }
};

const get = path => worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);

const itResponse = await get("/");
const itHtml = await itResponse.text();
if (itResponse.status !== 200 || !itHtml.includes('<html lang="it">')) throw new Error("i18n IT: home italiana non valida");
if (!itHtml.includes("La tua vita in un romanzo.") || itHtml.includes("Dein Leben als Roman.")) throw new Error("i18n IT: il contenuto italiano è stato alterato");
if (!itHtml.includes("spl-language-switcher") || !itHtml.includes('hreflang="de"') || !itHtml.includes('hreflang="en"')) throw new Error("i18n IT: selettore lingua mancante");

for (const locale of ["de", "en"]) {
  const redirect = await get(`/${locale}?formula=assisted`);
  if (redirect.status !== 308 || redirect.headers.get("location") !== `https://www.splendoria.vip/${locale}/?formula=assisted`) throw new Error(`i18n ${locale}: slash canonico non applicato`);
}

const cases = {
  de: {
    hero: "Dein Leben als Roman.",
    remembered: "Das Recht, in Erinnerung zu bleiben.",
    longForm: "Meine Großmutter schien eine geheime Geometrie zu kennen",
    privacyStart: "Ich habe die <a",
    privacyEnd: "gelesen und möchte zu diesem Projekt kontaktiert werden.",
    success: "Dein Projektblatt wurde an Splendoria übermittelt.",
    scriptSlider: "% Werk",
    scriptValidation: "Bitte gib mindestens drei durch Kommas getrennte Wörter ein.",
    scriptRating: "Erzählstruktur mit hoher narrativer Dichte",
    scriptScope: "Eine generationenübergreifende Geschichte",
    dateLocale: "de-DE"
  },
  en: {
    hero: "Your life as a novel.",
    remembered: "The right to be remembered.",
    longForm: "My grandmother seemed to know a secret geometry",
    privacyStart: "I have read the <a",
    privacyEnd: "and ask to be contacted about this project.",
    success: "Your Project Sheet has been entrusted to Splendoria.",
    scriptSlider: "% Work",
    scriptValidation: "Please enter at least three comma-separated words.",
    scriptRating: "High-density narrative structure",
    scriptScope: "A generational story",
    dateLocale: "en-GB"
  }
};

for (const [locale, expected] of Object.entries(cases)) {
  const response = await get(`/${locale}/?formula=assisted&contatto=inviato`);
  const html = await response.text();
  if (response.status !== 200 || response.headers.get("content-language") !== locale) throw new Error(`i18n ${locale}: status o Content-Language non validi`);
  if (response.headers.has("vary")) throw new Error(`i18n ${locale}: Vary Accept-Language non necessario con URL localizzato`);
  if (!html.includes(`<html lang="${locale}">`) || !html.includes(expected.hero) || !html.includes(expected.remembered)) throw new Error(`i18n ${locale}: traduzione principale incompleta`);
  if (html.includes("Il diritto di essere ricordati.") || html.includes("Mia nonna sembrava conoscere una geometria segreta")) throw new Error(`i18n ${locale}: residui italiani nella vetrina principale`);
  if (!html.includes(expected.longForm)) throw new Error(`i18n ${locale}: esempio narrativo lungo non tradotto`);
  if (!html.includes(expected.privacyStart) || !html.includes(expected.privacyEnd)) throw new Error(`i18n ${locale}: consenso privacy spezzato dal markup non tradotto`);
  if (!html.includes(expected.success)) throw new Error(`i18n ${locale}: stato dinamico del contatto non tradotto`);
  if (!html.includes(`rel="canonical" href="https://www.splendoria.vip/${locale}/"`) || !html.includes('hreflang="x-default"')) throw new Error(`i18n ${locale}: canonical/hreflang incompleti`);
  if (!html.includes(`href="/${locale}/" hreflang="${locale}" lang="${locale}" aria-current="page"`)) throw new Error(`i18n ${locale}: stato del selettore lingua non corretto`);
  const scriptPattern = new RegExp(`src="/assets/studio\\.js\\?[^\"]*lang=${locale}`);
  if (!scriptPattern.test(html)) throw new Error(`i18n ${locale}: script dinamico non riceve la lingua`);

  for (const value of ["Una stagione decisiva", "Una vita intera", "Una storia generazionale", "Un’impresa e la sua visione"]) {
    if (!html.includes(`name="legacyScope" value="${value}"`)) throw new Error(`i18n ${locale}: valore semantico scope alterato: ${value}`);
  }
  for (const value of ["Livello 1 · Assistenza guidata", "Livello 2 · Coerenza editoriale", "Livello 3 · Supervisione umana", "Livello 4 · Accompagnamento dedicato"]) {
    if (!html.includes(`value="${value}"`)) throw new Error(`i18n ${locale}: valore semantico governance alterato: ${value}`);
  }

  const scriptResponse = await get(`/assets/studio.js?v=20260901-5&lang=${locale}`);
  const script = await scriptResponse.text();
  if (scriptResponse.status !== 200 || !scriptResponse.headers.get("content-type")?.includes("javascript")) throw new Error(`i18n ${locale}: asset JS localizzato non valido`);
  if (!script.includes(expected.scriptSlider) || !script.includes(expected.scriptValidation) || !script.includes(expected.scriptRating) || !script.includes(expected.scriptScope) || !script.includes(expected.dateLocale)) throw new Error(`i18n ${locale}: stati dinamici dell'Assessment incompleti`);
  if (script.includes("Inserisci almeno tre parole separate da virgole.") || script.includes("Trama ad alta densità narrativa")) throw new Error(`i18n ${locale}: residui italiani negli stati dinamici della vetrina`);
}

console.log("i18n vetrina: IT preservato, DE/EN localizzati, valori semantici protetti, stati dinamici verificati");
