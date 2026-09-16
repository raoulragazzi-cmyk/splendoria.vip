import worker from "../src/i18n-session-worker.js";

const USER = {
  id: "user-1",
  email: "anna@example.com",
  nome: "Anna",
  passwordHash: "hash",
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: "2026-01-02T10:00:00.000Z"
};

function makeDb(withUser = true) {
  return {
    prepare(sql = "") {
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async run() { return { success: true, meta: { changes: 1 }, bindings }; },
        async first() {
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return withUser ? { ...USER } : null;
          if (sql.includes('(SELECT COUNT(*) FROM "BookProject"')) return { projects: 0, orders: 0 };
          if (sql.includes('SELECT COUNT(*) total FROM "BookProject"')) return { total: 0 };
          return null;
        },
        async all() {
          if (sql.includes('FROM "BookProject" p LEFT JOIN "BookChapter"')) return { results: [] };
          if (sql.includes('SELECT c.projectId,c.content')) return { results: [] };
          return { results: [] };
        }
      };
    },
    async batch(statements) { return statements.map(() => ({ success: true, meta: { changes: 1 } })); }
  };
}

function env(withUser = true) {
  return {
    DB: makeDb(withUser),
    APP_URL: "https://www.splendoria.vip",
    ADMIN_EMAIL: "raoulragazzi@gmail.com",
    EMAIL_FROM: "contatti@splendoria.vip",
    AI: { async run() { return { response: "ok" }; } }
  };
}

const send = (path, init = {}, withUser = true) => {
  const headers = new Headers(init.headers || {});
  if (withUser) headers.set("cookie", "spl_session=test-session");
  return worker.fetch(new Request(`https://www.splendoria.vip${path}`, { ...init, headers }), env(withUser));
};

const post = (path, data, withUser = true) => send(path, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(data)
}, withUser);

const cases = {
  de: {
    studio: ["Mein Studio", "Hallo, Anna", "Hier kannst du deine Bücher selbstständig erstellen", "Deine Geschichte beginnt hier", "Arbeitstitel", "Genre und Struktur anpassen", "Mein Buch beginnen"],
    account: ["Mein Konto", "Profil und Datenschutz", "Wie möchtest du genannt werden?", "E-Mail-Adresse ändern", "Meine Daten exportieren", "Mein Konto endgültig löschen"],
    profileSuccess: "Name wurde erfolgreich aktualisiert.",
    logoutMessage: "Du hast dein Studio verlassen. Du kannst dich mit denselben Zugangsdaten erneut anmelden.",
    month: "Januar",
    genre: "Autobiografie"
  },
  en: {
    studio: ["My Studio", "Hello, Anna", "Here you can create, edit and complete your books independently", "Your story starts here", "Working title", "Customise genre and structure", "Start my book"],
    account: ["My account", "Profile and privacy", "How would you like to be addressed?", "Change email address", "Export my data", "Permanently delete my account"],
    profileSuccess: "Name updated successfully.",
    logoutMessage: "You have signed out of your Studio. You can sign in again with the same credentials.",
    month: "January",
    genre: "Autobiography"
  }
};

for (const [locale, expected] of Object.entries(cases)) {
  const studioResponse = await send(`/${locale}/studio`);
  const studio = await studioResponse.text();
  if (studioResponse.status !== 200 || studioResponse.headers.get("content-language") !== locale) throw new Error(`client ${locale}: studio response non localizzata`);
  if (!studioResponse.headers.get("cache-control")?.includes("no-store")) throw new Error(`client ${locale}: studio cacheabile`);
  if (studioResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error(`client ${locale}: studio indicizzabile`);
  for (const marker of [
    `<html lang="${locale}">`, ...expected.studio,
    `href="/${locale}/account"`, `action="/${locale}/esci"`,
    `href="/${locale}/privacy-policy"`, `class="brand" href="/${locale}/"`,
    `src="/assets/studio.js?`, `lang=${locale}`,
    `value="Autobiografia">${expected.genre}</option>`,
    'value="84"', 'value="117"'
  ]) if (!studio.includes(marker)) throw new Error(`client ${locale}: studio manca ${marker}`);
  for (const residual of ["Il tuo Studio", "Crea un nuovo libro", ">Autobiografia</option>", 'action="/esci"']) {
    if (studio.includes(residual)) throw new Error(`client ${locale}: residuo italiano nello studio: ${residual}`);
  }
  if (!studio.includes('action="/nuovo-libro"')) throw new Error(`client ${locale}: il confine verso l'editor non deve essere falsamente localizzato prima del deep-pass editor`);

  const accountResponse = await send(`/${locale}/account`);
  const account = await accountResponse.text();
  if (accountResponse.status !== 200 || accountResponse.headers.get("content-language") !== locale) throw new Error(`client ${locale}: account response non localizzata`);
  for (const marker of [
    ...expected.account, expected.month,
    `href="/${locale}/studio"`, `href="/${locale}/account/esporta.json"`,
    `action="/${locale}/account/profilo"`, `action="/${locale}/account/email"`, `action="/${locale}/account/cancella"`,
    `action="/${locale}/esci"`, `href="/${locale}/privacy-policy"`,
    'pattern="CANCELLA"', "CANCELLA"
  ]) if (!account.includes(marker)) throw new Error(`client ${locale}: account manca ${marker}`);
  for (const residual of ["Il mio account", "Torna allo Studio", "Cancellazione permanente", "Account creato</span>"]) {
    if (account.includes(residual)) throw new Error(`client ${locale}: residuo italiano account: ${residual}`);
  }

  const profileResponse = await post(`/${locale}/account/profilo`, { nome: "Anna Maria" });
  const profile = await profileResponse.text();
  if (profileResponse.status !== 200 || !profile.includes(expected.profileSuccess) || !profile.includes('value="Anna Maria"')) throw new Error(`client ${locale}: aggiornamento profilo non preservato/localizzato`);
  if (!profile.includes(`action="/${locale}/account/profilo"`)) throw new Error(`client ${locale}: POST profilo perde il namespace lingua`);

  const exportResponse = await send(`/${locale}/account/esporta.json`);
  if (exportResponse.status !== 200 || !(exportResponse.headers.get("content-type") || "").includes("application/json")) throw new Error(`client ${locale}: export JSON non raggiungibile dal percorso localizzato`);

  const logoutResponse = await send(`/${locale}/esci`, { method: "POST" });
  if (logoutResponse.status < 300 || logoutResponse.status >= 400) throw new Error(`client ${locale}: logout non reindirizza`);
  const logoutLocation = new URL(logoutResponse.headers.get("location"));
  if (logoutLocation.pathname !== `/${locale}/area-clienti` || logoutLocation.searchParams.get("e") !== expected.logoutMessage) throw new Error(`client ${locale}: logout perde lingua o messaggio`);
  const clearCookie = logoutResponse.headers.get("set-cookie") || "";
  if (!clearCookie.includes("spl_session=") || !clearCookie.includes("Max-Age=0")) throw new Error(`client ${locale}: logout non invalida il cookie`);

  const unauthStudio = await send(`/${locale}/studio`, {}, false);
  if (unauthStudio.status < 300 || unauthStudio.status >= 400 || unauthStudio.headers.get("location") !== `https://www.splendoria.vip/${locale}/area-clienti`) throw new Error(`client ${locale}: redirect studio anonimo esce dalla lingua`);
  const unauthAccount = await send(`/${locale}/account`, {}, false);
  if (unauthAccount.status < 300 || unauthAccount.status >= 400 || unauthAccount.headers.get("location") !== `https://www.splendoria.vip/${locale}/area-clienti`) throw new Error(`client ${locale}: redirect account anonimo esce dalla lingua`);

  const admin = await send(`/${locale}/admin`);
  if (admin.status !== 404) throw new Error(`client ${locale}: admin non deve essere localizzato`);
}

for (const locale of ["de", "en"]) {
  const scriptResponse = await send(`/assets/studio.js?v=20260901-5&lang=${locale}`);
  const script = await scriptResponse.text();
  const expected = locale === "de" ? ["Zum Seitenanfang", "Nach oben"] : ["Back to the top of the page", "Back to top"];
  for (const marker of expected) if (!script.includes(marker)) throw new Error(`client ${locale}: script globale manca ${marker}`);
  if (script.includes("Torna all’inizio della pagina") || script.includes("Torna su")) throw new Error(`client ${locale}: script globale contiene residui italiani`);
}

console.log("client i18n: account, Studio shell e logout DE/EN verificati; valori genere canonici; editor volutamente fuori scope finché non passa il deep-pass dedicato");
