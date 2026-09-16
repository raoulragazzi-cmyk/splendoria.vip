import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/0006_editorial_safety_tables.sql", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

const requiredFragments = [
  'CREATE TABLE IF NOT EXISTS "BookChapterSection"',
  'chapterId TEXT PRIMARY KEY',
  'projectId TEXT NOT NULL',
  "section0 TEXT NOT NULL DEFAULT ''",
  "section1 TEXT NOT NULL DEFAULT ''",
  "section2 TEXT NOT NULL DEFAULT ''",
  'CREATE INDEX IF NOT EXISTS "BookChapterSection_project_idx"',
  'CREATE TABLE IF NOT EXISTS "BookProjectBackup"',
  'snapshotJson TEXT NOT NULL',
  "reason TEXT NOT NULL DEFAULT ''",
  'CREATE INDEX IF NOT EXISTS "BookProjectBackup_project_idx"',
  'ON "BookProjectBackup" (projectId, createdAt DESC)'
];

for (const fragment of requiredFragments) {
  if (!migration.includes(fragment)) throw new Error(`Migrazione 0006 incompleta: manca ${fragment}`);
}

// During the first rollout the runtime fallback must remain in place. It makes the
// migration additive and safe for environments where D1 migrations have not yet run.
for (const table of ['BookChapterSection', 'BookProjectBackup']) {
  if (!worker.includes(`CREATE TABLE IF NOT EXISTS \\"${table}\\"`)) {
    throw new Error(`Fallback runtime rimosso troppo presto per ${table}`);
  }
}

console.log("editorial safety migration: schema versionato e fallback runtime preservato");
