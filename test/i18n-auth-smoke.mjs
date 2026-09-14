import worker from "../src/i18n-auth-worker.js";

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

const send = (path, init = {}) => worker.fetch(new Request(`https://www.splendoria.vip${path}`, init), env);
const post = (path, data) => send(path, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(data)
});

const cases = {
  de: {
    register: "Erstelle dein Studio",
    registerButton: "Kostenlos registrieren",
    client: "Melde dich in deinem Studio an",
    forgot: "Passwort vergessen?",
    reset: "Zugang zurücksetzen",
    invalidEmail: "Gib eine gültige E-Mail-Adresse ein.",
    invalidLogin: "E-Mail-Adresse oder Passwort sind nicht korrekt.",
    invalidReset: "Der Link oder das Passwort ist ungültig."
  },
  en: {
    register: "Create your Studio",
    registerButton: "Register for free",
    client: "Sign in to your Studio",
    forgot: "Forgot your password?",
    reset: "Reset access",
    invalidEmail: "Enter a valid email address.",
    invalidLogin: "Email address or password is incorrect.",
    invalidReset: "The link or password is invalid."
  }
};

for (const [locale, expected] of Object.entries(cases)) {
  const registerResponse = await send(`/${locale}/registrati`);
  const register = await registerResponse.text();
  if (registerResponse.status !== 200 || registerResponse.headers.get("content-language") !== locale) throw new Error(`auth ${locale}: registrazione non localizzata`);
  if (registerResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error(`auth ${locale}: registrazione indicizzabile`);
  if (!registerResponse.headers.get("cache-control")?.includes("no-store")) throw new Error(`auth ${locale}: registrazione non protetta dalla cache`);
  for (const marker of [
    `<html lang="${locale}">`, expected.register, expected.registerButton,
    `action="/${locale}/registrati"`, `href="/${locale}/area-clienti"`,
    `href="/${locale}/privacy-policy"`, `class="brand" href="/${locale}/"`,
    'name="email"', 'name="nome"', 'name="password"', 'name="passwordConfirm"', 'name="privacyRead" value="yes"',
    'autocomplete="email"', 'autocomplete="name"', 'autocomplete="new-password"'
  ]) if (!register.includes(marker)) throw new Error(`auth ${locale}: registrazione manca ${marker}`);
  if (register.includes("Crea il tuo Studio") || register.includes('action="/registrati"')) throw new Error(`auth ${locale}: residuo/azione italiana nella registrazione`);

  const clientResponse = await send(`/${locale}/area-clienti`);
  const client = await clientResponse.text();
  for (const marker of [expected.client, `action="/${locale}/area-clienti"`, `href="/${locale}/password-dimenticata"`, `href="/${locale}/registrati"`, 'autocomplete="current-password"']) {
    if (!client.includes(marker)) throw new Error(`auth ${locale}: login cliente manca ${marker}`);
  }
  if (client.includes("Accedi al tuo Studio") || client.includes('href="/accedi"')) throw new Error(`auth ${locale}: login cliente contiene navigazione italiana/access choice`);

  const forgotResponse = await send(`/${locale}/password-dimenticata`);
  const forgot = await forgotResponse.text();
  if (!forgot.includes(expected.forgot) || !forgot.includes("name=\"email\"") || !forgot.includes(`href="/${locale}/area-clienti"`)) throw new Error(`auth ${locale}: recupero password incompleto`);

  const token = "12345678901234567890";
  const resetResponse = await send(`/${locale}/reimposta-password?token=${token}`);
  const reset = await resetResponse.text();
  for (const marker of [expected.reset, `name="token" value="${token}"`, 'name="passwordConfirm"', 'autocomplete="new-password"']) {
    if (!reset.includes(marker)) throw new Error(`auth ${locale}: reset password manca ${marker}`);
  }

  const invalidRegistrationResponse = await post(`/${locale}/registrati`, {
    email: "not-an-email",
    nome: "Mario",
    password: "1234567890",
    passwordConfirm: "1234567890",
    privacyRead: "yes"
  });
  const invalidRegistration = await invalidRegistrationResponse.text();
  if (!invalidRegistration.includes(expected.invalidEmail)) throw new Error(`auth ${locale}: errore registrazione non tradotto o body POST perso`);
  if (!invalidRegistration.includes('value="not-an-email"') || !invalidRegistration.includes('value="Mario"')) throw new Error(`auth ${locale}: registrazione non conserva i dati non sensibili dopo errore`);

  const invalidLoginResponse = await post(`/${locale}/area-clienti`, { email: "nobody@example.invalid", password: "wrong-password" });
  const invalidLogin = await invalidLoginResponse.text();
  if (!invalidLogin.includes(expected.invalidLogin)) throw new Error(`auth ${locale}: errore login non tradotto o body POST perso`);
  if (!invalidLogin.includes('value="nobody@example.invalid"')) throw new Error(`auth ${locale}: login non conserva email dopo errore`);

  const invalidResetResponse = await post(`/${locale}/reimposta-password`, { token: "short", password: "1234567890", passwordConfirm: "1234567890" });
  const invalidReset = await invalidResetResponse.text();
  if (!invalidReset.includes(expected.invalidReset)) throw new Error(`auth ${locale}: errore reset non tradotto o body POST perso`);

  const homeResponse = await send(`/${locale}/`);
  const home = await homeResponse.text();
  if (!home.includes(`href="/${locale}/registrati"`)) throw new Error(`auth ${locale}: CTA home non porta alla registrazione localizzata`);
  for (const forbidden of ['href="/registrati"', 'href="/area-clienti"', 'href="/accedi"']) {
    if (home.includes(forbidden)) throw new Error(`auth ${locale}: la home esce dal flusso lingua: ${forbidden}`);
  }

  const adminLocalized = await send(`/${locale}/area-amministratore`);
  if (adminLocalized.status !== 404) throw new Error(`auth ${locale}: l'area amministratore non deve essere localizzata`);
  const choiceLocalized = await send(`/${locale}/accedi`);
  if (choiceLocalized.status !== 404) throw new Error(`auth ${locale}: la scelta area con amministrazione non deve essere localizzata`);
}

console.log("auth i18n: registrazione, login cliente, recupero e reset DE/EN verificati; admin escluso");
