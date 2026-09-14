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
const get = path => worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);

const pages = {
  "/privacy-policy": {
    de: ["Datenschutzerklärung — Splendoria", "1. Verantwortlicher", "2. Verarbeitete Daten", "3. Zwecke und Rechtsgrundlagen", "4. Erzählungen, besondere Kategorien und Daten Dritter", "5. Künstliche Intelligenz und menschliche Aufsicht", "6. Erforderlichkeit der Bereitstellung", "7. Empfänger und Auftragsverarbeiter", "8. Übermittlungen außerhalb des Europäischen Wirtschaftsraums", "9. Speicherdauer", "10. Sicherheit", "11. Rechte betroffener Personen", "12. Minderjährige", "13. Änderungen"],
    en: ["Privacy Policy — Splendoria", "1. Data controller", "2. Data processed", "3. Purposes and legal bases", "4. Stories, special-category data and third-party data", "5. Artificial intelligence and human supervision", "6. Nature of data provision", "7. Recipients and processors", "8. Transfers outside the European Economic Area", "9. Retention", "10. Security", "11. Data-subject rights", "12. Minors", "13. Changes"]
  },
  "/cookie-policy": {
    de: ["Cookie-Richtlinie — Splendoria", "1. Was sie sind", "2. Verwendete Werkzeuge", "3. Informationsbanner und Einwilligung", "4. Verwaltung im Browser", "5. Verantwortlicher und Rechte", "6. Aktualisierungen"],
    en: ["Cookie Policy — Splendoria", "1. What they are", "2. Tools used", "3. Information banner and consent", "4. Managing them in the browser", "5. Controller and rights", "6. Updates"]
  },
  "/termini-condizioni": {
    de: ["Allgemeine Geschäftsbedingungen — Splendoria", "1. Diensteanbieter", "2. Gegenstand", "3. Konto und erstes Kapitel", "4. Programme, Preise und Zusatzleistungen", "5. Vertragsschluss", "6. Widerrufsrecht für Verbraucher", "7. Materialien und Verantwortung des Nutzers", "8. Künstliche Intelligenz und Freigabe", "9. Geistiges Eigentum", "10. Überarbeitungen, Freigabe und Lieferung", "11. Haftung", "12. Aussetzung und Schließung", "13. Anwendbares Recht und Streitigkeiten", "14. Änderungen"],
    en: ["Terms and conditions — Splendoria", "1. Service provider", "2. Scope", "3. Account and first chapter", "4. Programmes, prices and additional services", "5. Formation of the contract", "6. Consumer right of withdrawal", "7. Materials and user responsibility", "8. Artificial intelligence and approval", "9. Intellectual property", "10. Revisions, approval and delivery", "11. Liability", "12. Suspension and closure", "13. Governing law and disputes", "14. Changes"]
  },
  "/note-legali": {
    de: ["Rechtliche Hinweise — Splendoria", "Identität und Kontakt", "Zweck der Website", "Geistiges Eigentum", "Verfügbarkeit und Sicherheit", "Künstliche Intelligenz", "Links und Inhalte Dritter"],
    en: ["Legal notice — Splendoria", "Identity and contact", "Purpose of the website", "Intellectual property", "Availability and security", "Artificial intelligence", "Third-party links and content"]
  },
  "/trasparenza-ai": {
    de: ["KI-Transparenz — Splendoria", "Du interagierst mit einem System künstlicher Intelligenz", "Was die Muse tut", "Was sie nicht tut", "Kontrolle durch den Nutzer und menschliche Aufsicht", "Grenzen und verantwortungsvolle Nutzung", "Daten und Diktierfunktion", "Kontakt"],
    en: ["AI transparency — Splendoria", "You are interacting with an artificial intelligence system", "What the Muse does", "What it does not do", "User control and human supervision", "Limitations and responsible use", "Data and dictation", "Contact"]
  }
};

for (const [basePath, locales] of Object.entries(pages)) {
  for (const locale of ["de", "en"]) {
    const response = await get(`/${locale}${basePath}`);
    const html = await response.text();
    if (response.status !== 200) throw new Error(`${basePath} ${locale}: status ${response.status}`);
    if (response.headers.get("content-language") !== locale) throw new Error(`${basePath} ${locale}: Content-Language mancante`);
    if (!html.includes(`<html lang="${locale}">`)) throw new Error(`${basePath} ${locale}: lang HTML errato`);
    if (!html.includes(`rel="canonical" href="https://www.splendoria.vip/${locale}${basePath}"`)) throw new Error(`${basePath} ${locale}: canonical errato`);
    if (!html.includes(`href="/${locale}${basePath}" hreflang="${locale}" lang="${locale}" aria-current="page"`)) throw new Error(`${basePath} ${locale}: language switcher non mantiene pagina`);
    for (const marker of locales[locale]) if (!html.includes(marker)) throw new Error(`${basePath} ${locale}: manca marker ${marker}`);
    for (const link of ["privacy-policy", "cookie-policy", "termini-condizioni", "note-legali", "trasparenza-ai"]) {
      if (html.includes(`href="/${link}"`)) throw new Error(`${basePath} ${locale}: link pubblico esce dalla lingua verso /${link}`);
    }
    if (locale === "de" && html.includes("Partita IVA")) throw new Error(`${basePath} de: etichetta fiscale italiana residua`);
    if (locale === "en" && html.includes("Partita IVA")) throw new Error(`${basePath} en: etichetta fiscale italiana residua`);
  }
}

const privacyDe = await (await get("/de/privacy-policy")).text();
if (!privacyDe.includes("Art. 6 Abs. 1 lit. b DSGVO") || !privacyDe.includes("Art. 9 Abs. 2 lit. a DSGVO")) throw new Error("privacy de: basi giuridiche GDPR non localizzate correttamente");
const privacyEn = await (await get("/en/privacy-policy")).text();
if (!privacyEn.includes("Art. 6(1)(b) GDPR") || !privacyEn.includes("Art. 9(2)(a)")) throw new Error("privacy en: legal bases not localised correctly");
const termsDe = await (await get("/de/termini-condizioni")).text();
if (!termsDe.includes("italienisches Recht") || !termsDe.includes("14 Tagen")) throw new Error("terms de: legge applicabile o recesso incompleti");
const termsEn = await (await get("/en/termini-condizioni")).text();
if (!termsEn.includes("Italian law applies") || !termsEn.includes("within 14 days")) throw new Error("terms en: governing law or withdrawal incomplete");

console.log("legal i18n: privacy, cookie, terms, legal notice and AI transparency DE/EN verified");
