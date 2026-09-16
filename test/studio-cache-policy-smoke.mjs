import studioWorker from "../src/studio-worker.js";
import { readFileSync } from "node:fs";

const workerSource = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const studioSource = readFileSync(new URL("../src/studio-worker.js", import.meta.url), "utf8");
const smokeSource = readFileSync(new URL("./smoke.mjs", import.meta.url), "utf8");
for (const [name, source] of [["worker", workerSource], ["smoke", smokeSource]]) {
  if (!source.includes('/assets/studio.js?v=20260916-1')) throw new Error(`Studio JS: ${name} version not aligned`);
}
const marker = "  if (url.pathname === '/assets/studio.js' && contentType.includes('javascript')) {";
const nextMarker = "\n\n  if (/^\\/libro\\/[^/]+(?:\\/.*)?$/.test(url.pathname)";
const start = studioSource.indexOf(marker);
const end = studioSource.indexOf(nextMarker, start);
if (start < 0 || end <= start) throw new Error("Studio JS: transformed asset block not found");
const block = studioSource.slice(start, end);
if (!block.includes("headers.set('cache-control', 'no-store, max-age=0')")) throw new Error("Studio JS: transformed asset is not no-store");
if (block.includes("headers.set('cache-control', 'public, max-age=31536000, immutable')") || block.includes("headers.set('cdn-cache-control', 'public, max-age=31536000, immutable')")) throw new Error("Studio JS: long-lived cache directive still active");
for (const header of ["cdn-cache-control", "etag", "last-modified"]) {
  if (!block.includes(`headers.delete('${header}')`)) throw new Error(`Studio JS: ${header} validator/cache header not removed`);
}
const response = await studioWorker.fetch(new Request("https://www.splendoria.vip/assets/studio.js?v=20260916-1"), {
  DB: { prepare() { throw new Error("Studio JS asset must not query D1"); } }
});
if (response.status !== 200) throw new Error(`Studio JS: unexpected status ${response.status}`);
if (response.headers.get("cache-control") !== "no-store, max-age=0") throw new Error("Studio JS: runtime cache-control is not no-store");
if (response.headers.has("cdn-cache-control")) throw new Error("Studio JS: CDN cache-control leaked from base asset");
if (response.headers.has("etag") || response.headers.has("last-modified")) throw new Error("Studio JS: static validators leaked onto transformed representation");
const body = await response.text();
if (!body.includes("splendoria:client-draft:v1:")) throw new Error("Studio JS: runtime patch was not applied");
console.log("studio cache policy: transformed JS cannot remain stale across Worker patch changes");
