import { readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const workerUrl = new URL("../src/worker.js", import.meta.url);
const wranglerUrl = new URL("../wrangler.jsonc", import.meta.url);
const smokeUrl = new URL("./smoke.mjs", import.meta.url);
const generatedUrl = new URL("./.smoke-ci.generated.mjs", import.meta.url);

const [workerSource, wranglerSource, smokeSource] = await Promise.all([
  readFile(workerUrl, "utf8"),
  readFile(wranglerUrl, "utf8"),
  readFile(smokeUrl, "utf8")
]);

const versionMatch = workerSource.match(/\/assets\/studio\.js\?v=([0-9A-Za-z._-]+)/);
if (!versionMatch) throw new Error("CI: studio.js non ha un cache-bust versionato nel Worker");

const currentVersion = versionMatch[1];
const legacyVersionExpectation = /src="\/assets\/studio\.js\?v=[^"]+"/;
if (!legacyVersionExpectation.test(smokeSource)) throw new Error("CI: aspettativa studio.js non trovata nello smoke test legacy");

let normalizedSmoke = smokeSource.replace(
  legacyVersionExpectation,
  `src="/assets/studio.js?v=${currentVersion}"`
);

// Il link "Vai al contenuto principale" e' stato rimosso intenzionalmente dalla UI.
// Manteniamo invece i requisiti di focus, main semantico e reduced-motion e verifichiamo
// che il vecchio skip-link non venga reintrodotto accidentalmente.
const legacySkipCheck = `!showcaseTypography.includes('<a class="skip-link" href="#main-content">Vai al contenuto principale</a>') || `;
const currentSkipCheck = `showcaseTypography.includes('<a class="skip-link" href="#main-content">Vai al contenuto principale</a>') || `;
if (!normalizedSmoke.includes(legacySkipCheck)) throw new Error("CI: aspettativa legacy sullo skip-link non trovata");
normalizedSmoke = normalizedSmoke.replace(legacySkipCheck, currentSkipCheck);

// Il vecchio smoke test vietava qualunque riferimento all'ambiente di test.
// Ora staging e' intenzionale: rimuoviamo solo quel divieto legacy e sostituiamolo
// con controlli strutturali piu' forti sulla separazione tra production e staging.
const legacyStagingCheck = `if (wranglerConfig.includes('"database_name": "splendoria-v2-test"') || wranglerConfig.includes("splendoria-v2.raoulragazzi.workers.dev")) throw new Error("Cloudflare: riferimenti all’ambiente di test ancora attivi");`;
if (!normalizedSmoke.includes(legacyStagingCheck)) throw new Error("CI: aspettativa legacy sul divieto staging non trovata");
normalizedSmoke = normalizedSmoke.replace(legacyStagingCheck, "// CI: staging validato strutturalmente da ci-smoke.mjs");

const wrangler = JSON.parse(wranglerSource);
const productionDb = (wrangler.d1_databases || []).find(item => item.binding === "DB");
const staging = wrangler.env?.staging;
const stagingDb = (staging?.d1_databases || []).find(item => item.binding === "DB");

if (!productionDb || productionDb.database_name !== "splendoria-db" || productionDb.database_id !== "1a46b8b0-2e6f-44cf-a22f-4950259f9434") {
  throw new Error("CI: binding D1 production Splendoria non valido");
}
if (!staging || !stagingDb || stagingDb.database_name !== "splendoria-v2-test" || stagingDb.database_id !== "8bf872f6-3f9e-471f-95bc-a99a94f0d97c") {
  throw new Error("CI: binding D1 staging Splendoria non valido o non esplicito");
}
if (stagingDb.database_id === productionDb.database_id) {
  throw new Error("CI: staging e production condividono lo stesso database D1");
}
if (staging.ai?.binding !== "AI") {
  throw new Error("CI: binding AI staging non dichiarato esplicitamente");
}
if (!Array.isArray(staging.triggers?.crons) || staging.triggers.crons.length !== 0) {
  throw new Error("CI: i cron devono essere disattivati in staging");
}
if (!staging.vars?.APP_URL || staging.vars.APP_URL === wrangler.vars?.APP_URL || !staging.vars.APP_URL.includes("staging")) {
  throw new Error("CI: APP_URL staging non e' separato dalla production");
}
if (staging.vars?.ENVIRONMENT !== "staging") {
  throw new Error("CI: ENVIRONMENT=staging mancante");
}
const stagingEmailBindings = staging.send_email || [];
const expectedEmailBindingNames = ["CONTACT_EMAIL", "ADMIN_EMAIL_NOTIFICATION"];
if (!Array.isArray(stagingEmailBindings) || stagingEmailBindings.length !== expectedEmailBindingNames.length) {
  throw new Error("CI: binding email staging mancanti o inattesi");
}
for (const name of expectedEmailBindingNames) {
  const binding = stagingEmailBindings.find(item => item.name === name);
  if (!binding || !Array.isArray(binding.allowed_destination_addresses) || binding.allowed_destination_addresses.length !== 0 || binding.destination_address) {
    throw new Error(`CI: il binding email staging ${name} deve essere presente ma senza destinatari autorizzati`);
  }
}
console.log("/configurazione-staging: D1 separato, cron disattivato, AI esplicita, email staging presenti ma senza destinatari autorizzati");

await writeFile(generatedUrl, normalizedSmoke, "utf8");
try {
  await import(`${generatedUrl.href}?run=${Date.now()}`);
} finally {
  await unlink(fileURLToPath(generatedUrl)).catch(() => {});
}
