import worker, { localizeTransactionalEmail } from "../src/i18n-email-worker.js";

const USER = {
  id: "email-user",
  email: "anna@example.com",
  nome: "Anna",
  passwordHash: "pbkdf2$2$salt$key",
  createdAt: "2026-01-01T10:00:00.000Z",
  emailVerifiedAt: null
};

function makeRuntime() {
  const sent = [];
  const DB = {
    prepare(sql = "") {
      let bindings = [];
      return {
        sql,
        bind(...values) { bindings = values; return this; },
        async run() { return { success: true, meta: { changes: 1 }, bindings }; },
        async first() {
          if (sql === "SELECT 1 AS ok") return { ok: 1 };
          if (sql.includes('FROM "Session" s JOIN "User"')) return { ...USER };
          if (sql.includes('FROM "AuthThrottle"')) return null;
          if (sql.includes('SELECT id,email,nome FROM "User" WHERE lower(trim(email))=?')) return { id: USER.id, email: USER.email, nome: USER.nome };
          return null;
        },
        async all() { return { results: [] }; }
      };
    },
    async batch(statements) { return (statements || []).map(() => ({ success: true, meta: { changes: 1 } })); }
  };
  const env = {
    DB,
    APP_URL: "https://www.splendoria.vip",
    ADMIN_EMAIL: "raoulragazzi@gmail.com",
    EMAIL_FROM: "contatti@splendoria.vip",
    CONTACT_EMAIL: {
      async send(message) { sent.push(message); return { messageId: `msg-${sent.length}` }; }
    },
    AI: { async run() { return { response: "ok" }; } }
  };
  return { env, sent };
}

function post(runtime, path, data, withSession = false) {
  const headers = new Headers({ "content-type": "application/x-www-form-urlencoded" });
  if (withSession) headers.set("cookie", "spl_session=email-session");
  return worker.fetch(new Request(`https://www.splendoria.vip${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(data)
  }), runtime.env);
}

const sampleWelcome = {
  to: USER.email,
  subject: "Benvenuto in Splendoria · verifica il tuo indirizzo",
  text: `Ciao Anna,\n\nbenvenuto in Splendoria. Verifica il tuo indirizzo entro 24 ore per attivare la Musa:\nhttps://www.splendoria.vip/verifica-email?token=abc\n\nPuoi già entrare nello Studio e raccogliere i ricordi. La prova del primo progetto dura 14 giorni e comprende fino a 3 generazioni del primo capitolo.\n\nGuida completa: https://www.splendoria.vip/guida\n\nSe non hai creato tu l’account, ignora questo messaggio.`,
  html: `<p>Ciao Anna,</p><p>benvenuto in Splendoria. Verifica il tuo indirizzo entro 24 ore per attivare la Musa.</p><p><a href="https://www.splendoria.vip/verifica-email?token=abc">Verifica l’indirizzo email</a></p><p>Puoi già entrare nello Studio e raccogliere i ricordi. La prova del primo progetto dura 14 giorni e comprende fino a 3 generazioni del primo capitolo.</p><p><a href="https://www.splendoria.vip/guida">Apri la guida completa allo Studio</a></p><p>Se non hai creato tu l’account, ignora questo messaggio.</p>`
};

const sampleReset = {
  to: USER.email,
  subject: "Reimposta la password di Splendoria",
  text: `Ciao Anna,\n\napri questo collegamento entro 30 minuti per scegliere una nuova password:\nhttps://www.splendoria.vip/reimposta-password?token=abc\n\nSe non hai richiesto tu il recupero, ignora questo messaggio.`,
  html: `<p>Ciao Anna,</p><p>apri questo collegamento entro 30 minuti per scegliere una nuova password:</p><p><a href="https://www.splendoria.vip/reimposta-password?token=abc">Reimposta la password</a></p><p>Se non hai richiesto tu il recupero, ignora questo messaggio.</p>`
};

for (const locale of ["de", "en"]) {
  const welcome = localizeTransactionalEmail(sampleWelcome, locale);
  const reset = localizeTransactionalEmail(sampleReset, locale);
  if (!welcome.text.includes(`/${locale}/verifica-email?token=abc`) || !welcome.html.includes(`/${locale}/guida`)) throw new Error(`${locale}: welcome email links not localized`);
  if (!reset.text.includes(`/${locale}/reimposta-password?token=abc`) || !reset.html.includes(`/${locale}/reimposta-password?token=abc`)) throw new Error(`${locale}: reset email links not localized`);
  if (welcome.subject.includes("Benvenuto") || reset.subject.includes("Reimposta la password")) throw new Error(`${locale}: email subject left in Italian`);
  if (welcome.text.includes("Guida completa") || reset.text.includes("Se non hai richiesto")) throw new Error(`${locale}: email body left in Italian`);

  const invalidVerification = await worker.fetch(new Request(`https://www.splendoria.vip/${locale}/verifica-email?token=short`), makeRuntime().env);
  const invalidHtml = await invalidVerification.text();
  if (invalidVerification.status !== 200 || invalidVerification.headers.get("content-language") !== locale) throw new Error(`${locale}: verification page not localized`);
  const invalidMarker = locale === "de" ? "Bestätigung fehlgeschlagen" : "Verification failed";
  if (!invalidHtml.includes(invalidMarker) || !invalidHtml.includes(`href="/${locale}/area-clienti"`)) throw new Error(`${locale}: verification failure copy/link not localized`);
  if (invalidHtml.includes("Verifica non riuscita") || invalidHtml.includes('href="/area-clienti"')) throw new Error(`${locale}: verification page leaks Italian route/copy`);

  const resetRuntime = makeRuntime();
  const forgotResponse = await post(resetRuntime, `/${locale}/password-dimenticata`, { email: USER.email });
  if (forgotResponse.status !== 200) throw new Error(`${locale}: forgot-password POST failed`);
  if (resetRuntime.sent.length !== 1) throw new Error(`${locale}: reset email not sent`);
  const sentReset = resetRuntime.sent[0];
  if (!sentReset.text.includes(`/${locale}/reimposta-password?token=`) || sentReset.subject === "Reimposta la password di Splendoria") throw new Error(`${locale}: real reset email not localized`);

  const verifyRuntime = makeRuntime();
  const resendResponse = await post(verifyRuntime, `/${locale}/reinvia-verifica-email`, {}, true);
  const resendHtml = await resendResponse.text();
  if (resendResponse.status !== 200 || resendResponse.headers.get("content-language") !== locale) throw new Error(`${locale}: resend verification page failed`);
  if (verifyRuntime.sent.length !== 1) throw new Error(`${locale}: verification email not sent`);
  const sentWelcome = verifyRuntime.sent[0];
  if (!sentWelcome.text.includes(`/${locale}/verifica-email?token=`) || !sentWelcome.html.includes(`/${locale}/guida`) || sentWelcome.subject === "Benvenuto in Splendoria · verifica il tuo indirizzo") throw new Error(`${locale}: real verification email not localized`);
  const resendMarker = locale === "de" ? "Neuer Link gesendet" : "New link sent";
  if (!resendHtml.includes(resendMarker) || !resendHtml.includes(`href="/${locale}/studio"`)) throw new Error(`${locale}: resend success page not localized`);
}

const adminLike = { subject: "Nuova registrazione Splendoria", text: "Admin notification", html: "<p>Admin notification</p>" };
if (localizeTransactionalEmail(adminLike, "de") !== adminLike) throw new Error("non-customer email must remain untouched");

console.log("transactional i18n: verification/reset pages and customer emails keep DE/EN locale; unrelated/admin mail remains untouched");
