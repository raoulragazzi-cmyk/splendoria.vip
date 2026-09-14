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
    de: ["Datenschutzerklärung — Splendoria", "1. Verantwortlicher", "2. Welche Daten wir verarbeiten", "3. Zwecke und Rechtsgrundlagen", "4. Sensible Erinnerungen und Daten anderer Personen", "5. Künstliche Intelligenz und menschliche Kontrolle", "6. Backup copy in the browser", "7. Empfänger und Übermittlungen", "8. Speicherdauer", "9. Sicherheit", "10. Rechte", "11. Minderjährige und Aktualisierungen"],
    en: ["Privacy Policy — Splendoria", "1. Data controller", "2. Data we process", "3. Purposes and legal bases", "4. Sensitive memories and other people’s data", "5. Artificial intelligence and human control", "6. Backup copy in the browser", "7. Recipients and transfers", "8. Retention", "9. Security", "10. Rights", "11. Minors and updates"]
  },
  "/cookie-policy": {
    de: ["Cookie-Richtlinie — Splendoria", "1. Kurz gesagt", "2. Verwendete Werkzeuge", "3. Warum wir nicht „Alle akzeptieren“ fragen", "4. Lokale Entwurfskopien", "5. Cookies und lokale Daten verwalten", "6. Kein websiteübergreifendes Tracking", "7. Verantwortlicher und Rechte"],
    en: ["Cookie Policy — Splendoria", "1. In brief", "2. Tools used", "3. Why we do not ask you to “Accept all”", "4. Local draft copies", "5. Managing cookies and local data", "6. No cross-site tracking", "7. Controller and rights"]
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

function renderedHeadings(html) {
  return [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .join(" | ");
}

for (const [basePath, locales] of Object.entries(pages)) {
  for (const locale of ["de", "en"]) {
    const response = await get(`/${locale}${basePath}`);
    const html = await response.text();
    if (response.status !== 200) throw new Error(`${basePath} ${locale}: status ${response.status}`);
    if (response.headers.get("content-language") !== locale) throw new Error(`${basePath} ${locale}: Content-Language mancante`);
    if (!html.includes(`<html lang="${locale}">`)) throw new Error(`${basePath} ${locale}: lang HTML errato`);
    if (!html.includes(`rel="canonical" href="https://www.splendoria.vip/${locale}${basePath}"`)) throw new Error(`${basePath} ${locale}: canonical errato`);
    if (!html.includes(`href="/${locale}${basePath}" hreflang="${locale}" lang="${locale}" aria-current="page"`)) throw new Error(`${basePath} ${locale}: language switcher non mantiene pagina`);
    for (const marker of locales[locale]) {
      if (!html.includes(marker)) throw new Error(`${basePath} ${locale}: manca marker ${marker}. H2 renderizzati: ${renderedHeadings(html)}`);
    }
    for (const link of ["privacy-policy", "cookie-policy", "termini-condizioni", "note-legali", "trasparenza-ai"]) {
      if (html.includes(`href="/${link}"`)) throw new Error(`${basePath} ${locale}: link pubblico esce dalla lingua verso /${link}`);
    }
    if (html.includes("Partita IVA")) throw new Error(`${basePath} ${locale}: etichetta fiscale italiana residua`);
  }
}

const privacyDe = await (await get("/de/privacy-policy")).text();
for (const marker of [
  "Wir erklären in verständlicher Form, welche Daten wir verarbeiten",
  "lokale Sicherungskopien von Entwürfen",
  "Art. 6 Abs. 1 lit. b DSGVO",
  "Art. 9 Abs. 2 lit. a DSGVO",
  "bis zu 365 Tage nach der letzten Änderung",
  "italienischen Datenschutzaufsichtsbehörde"
]) if (!privacyDe.includes(marker)) throw new Error(`privacy de: current-source marker missing: ${marker}`);
for (const residual of ["Quali dati trattiamo", "Ricordi sensibili e dati di altre persone", "Copia di sicurezza nel browser", "Destinatari e trasferimenti", "Minori e aggiornamenti", "Splendoria non vende dati personali"]) {
  if (privacyDe.includes(residual)) throw new Error(`privacy de: residuo italiano: ${residual}`);
}

const privacyEn = await (await get("/en/privacy-policy")).text();
for (const marker of [
  "We explain in plain language what data we process",
  "local backup copies of drafts",
  "Art. 6(1)(b) GDPR",
  "Art. 9(2)(a) GDPR",
  "up to 365 days after the last change",
  "Italian Data Protection Authority"
]) if (!privacyEn.includes(marker)) throw new Error(`privacy en: current-source marker missing: ${marker}`);
for (const residual of ["Quali dati trattiamo", "Ricordi sensibili e dati di altre persone", "Copia di sicurezza nel browser", "Destinatari e trasferimenti", "Minori e aggiornamenti", "Splendoria non vende dati personali"]) {
  if (privacyEn.includes(residual)) throw new Error(`privacy en: residuo italiano: ${residual}`);
}

const cookieDe = await (await get("/de/cookie-policy")).text();
for (const marker of ["keine Social-Tracker", "Lokale Entwurfskopien", "365 Tage nach der letzten Änderung", "Kein websiteübergreifendes Tracking"]) {
  if (!cookieDe.includes(marker)) throw new Error(`cookie de: current-source marker missing: ${marker}`);
}
for (const residual of ["Perché non chiediamo", "Copie locali delle bozze", "Come gestire cookie e dati locali", "Nessun tracciamento incrociato"]) {
  if (cookieDe.includes(residual)) throw new Error(`cookie de: residuo italiano: ${residual}`);
}

const cookieEn = await (await get("/en/cookie-policy")).text();
for (const marker of ["no social trackers", "Local draft copies", "365 days after the last change", "No cross-site tracking"]) {
  if (!cookieEn.includes(marker)) throw new Error(`cookie en: current-source marker missing: ${marker}`);
}
for (const residual of ["Perché non chiediamo", "Copie locali delle bozze", "Come gestire cookie e dati locali", "Nessun tracciamento incrociato"]) {
  if (cookieEn.includes(residual)) throw new Error(`cookie en: residuo italiano: ${residual}`);
}

const termsDe = await (await get("/de/termini-condizioni")).text();
if (!termsDe.includes("italienisches Recht") || !termsDe.includes("14 Tagen")) throw new Error("terms de: legge applicabile o recesso incompleti");
const termsEn = await (await get("/en/termini-condizioni")).text();
if (!termsEn.includes("Italian law applies") || !termsEn.includes("within 14 days")) throw new Error("terms en: governing law or withdrawal incomplete");

console.log("legal i18n: current privacy center, terms, legal notice and AI transparency DE/EN verified");
