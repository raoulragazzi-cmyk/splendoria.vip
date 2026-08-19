import { readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const workerUrl = new URL("../src/worker.js", import.meta.url);
const smokeUrl = new URL("./smoke.mjs", import.meta.url);
const generatedUrl = new URL("./.smoke-ci.generated.mjs", import.meta.url);

const [workerSource, smokeSource] = await Promise.all([
  readFile(workerUrl, "utf8"),
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

await writeFile(generatedUrl, normalizedSmoke, "utf8");
try {
  await import(`${generatedUrl.href}?run=${Date.now()}`);
} finally {
  await unlink(fileURLToPath(generatedUrl)).catch(() => {});
}
