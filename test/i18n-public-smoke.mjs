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
  AI: { async run() { return { response: "Le radici\nLa svolta\nIl futuro\nEpilogo" }; } }
};
const get = path => worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);

for (const locale of ["de", "en"]) {
  const home = await get(`/${locale}/?contatto=errore`);
  const html = await home.text();
  const expectedLast = locale === "de"
    ? "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte"
    : "She had already been at the stove for hours. When we arrived, the house was full of aromas";
  if (!html.includes(expectedLast)) throw new Error(`public i18n ${locale}: ultimo paragrafo dell'esempio narrativo non tradotto`);
  if (html.includes("Lei era già ai fornelli da ore")) throw new Error(`public i18n ${locale}: residuo italiano nel quarto paragrafo narrativo`);
  const errorCopy = locale === "de" ? "Die Anfrage wurde gespeichert" : "The request was saved";
  if (!html.includes(errorCopy)) throw new Error(`public i18n ${locale}: stato errore del form non tradotto`);
  if (!html.includes(`class="brand" href="/${locale}/"`)) throw new Error(`public i18n ${locale}: logo non ritorna alla home della stessa lingua`);
}

const GUIDE_CASES = {
  de: {
    title: "Studio-Leitfaden — Splendoria",
    hero: "Dein Buch, Schritt für Schritt",
    source: "Genügend konkrete Fakten bereitstellen",
    muse: "Vom Interview zum Kapitel",
    italianRule: "Wenn das Buch auf Italienisch geschrieben wird",
    trial: "Die Testphase dauert 14 Tage",
    help: "Wenn etwas nicht funktioniert",
    nav: "So funktioniert es"
  },
  en: {
    title: "Studio Guide — Splendoria",
    hero: "Your book, one step at a time",
    source: "Provide enough concrete facts",
    muse: "From interview to chapter",
    italianRule: "When the book is written in Italian",
    trial: "It lasts 14 days",
    help: "If something is not working",
    nav: "How it works"
  }
};

for (const [locale, expected] of Object.entries(GUIDE_CASES)) {
  const response = await get(`/${locale}/guida`);
  const html = await response.text();
  if (response.status !== 200 || response.headers.get("content-language") !== locale) throw new Error(`guide ${locale}: response locale non valida`);
  for (const marker of [expected.hero, expected.source, expected.muse, expected.italianRule, expected.trial, expected.help, expected.nav]) {
    if (!html.includes(marker)) throw new Error(`guide ${locale}: manca traduzione: ${marker}`);
  }
  if (!html.includes(`<title>${expected.title}</title>`)) throw new Error(`guide ${locale}: title SEO errato`);
  if (!html.includes(`rel="canonical" href="https://www.splendoria.vip/${locale}/guida"`)) throw new Error(`guide ${locale}: canonical errato`);
  if (!html.includes(`href="/${locale}/guida" hreflang="${locale}" lang="${locale}" aria-current="page"`)) throw new Error(`guide ${locale}: switcher non mantiene la pagina corrente`);
  if (!html.includes(`href="/${locale}/#metodo"`) || !html.includes(`href="/${locale}/#formule"`)) throw new Error(`guide ${locale}: navigazione alla home localizzata incompleta`);
  for (const italian of ["Il tuo libro, un passo alla volta", "Affida fatti sufficienti", "Dall’intervista al capitolo", "Se qualcosa non funziona"]) {
    if (html.includes(italian)) throw new Error(`guide ${locale}: residuo italiano visibile: ${italian}`);
  }
}

for (const locale of ["de", "en"]) {
  const response = await get(`/${locale}/admin`);
  if (response.status !== 404) throw new Error(`admin ${locale}: non deve esistere una route amministrativa localizzata`);
}

console.log("public i18n: home deep-pass e guida DE/EN verificati; admin non localizzato");
