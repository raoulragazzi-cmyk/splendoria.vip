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
const legacyExpectation = /src="\/assets\/studio\.js\?v=[^"]+"/;
if (!legacyExpectation.test(smokeSource)) throw new Error("CI: aspettativa studio.js non trovata nello smoke test legacy");

const normalizedSmoke = smokeSource.replace(
  legacyExpectation,
  `src="/assets/studio.js?v=${currentVersion}"`
);

await writeFile(generatedUrl, normalizedSmoke, "utf8");
try {
  await import(`${generatedUrl.href}?run=${Date.now()}`);
} finally {
  await unlink(fileURLToPath(generatedUrl)).catch(() => {});
}
