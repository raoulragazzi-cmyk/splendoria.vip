import { readFileSync } from "node:fs";

const wrapper = readFileSync(new URL("../src/studio-cache-policy-worker.js", import.meta.url), "utf8");
const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");

if (!wrangler.includes('"main": "src/studio-cache-policy-worker.js"')) {
  throw new Error("Studio cache policy: il wrapper non è l'entry point Wrangler");
}

if (!wrapper.includes('url.pathname !== STUDIO_SCRIPT_PATH')) {
  throw new Error("Studio cache policy: manca il vincolo alla sola route /assets/studio.js");
}

for (const fragment of [
  'cache-control", "no-cache, max-age=0, must-revalidate',
  'cdn-cache-control", "no-cache, max-age=0, must-revalidate',
  'x-splendoria-studio-cache-policy", "revalidate'
]) {
  if (!wrapper.includes(fragment)) throw new Error(`Studio cache policy incompleta: ${fragment}`);
}

for (const delegatedHandler of ["appWorker.email", "appWorker.scheduled"]) {
  if (!wrapper.includes(delegatedHandler)) throw new Error(`Studio cache policy: handler non delegato: ${delegatedHandler}`);
}

console.log("studio cache policy: revalidation scoped to transformed Studio JS; email/scheduled preserved");
