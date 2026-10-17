import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const duplicate = 'class="button secondary muse-draft-button" formaction="/libro/${id}/capitolo/${c.id}/genera"';
if (worker.includes(duplicate)) throw new Error("Studio chapter: duplicate bottom Muse CTA still present");
const primary = '<button class="muse-draft-button" formaction="/libro/${id}/capitolo/${c.id}/genera" formnovalidate>Affidati alla Musa</button>';
if (!worker.includes(primary)) throw new Error("Studio chapter: primary Affidati alla Musa CTA missing");
if (!worker.includes('<button class="button">Salva le mie modifiche</button>')) throw new Error("Studio chapter: explicit save CTA missing");
console.log("single Muse CTA: primary generation action preserved; duplicate removed");
