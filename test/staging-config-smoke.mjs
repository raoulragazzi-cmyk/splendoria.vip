import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const staging = config.env?.staging;
if (!staging) throw new Error('staging config missing');

if (staging.name !== 'splendoria-v2-staging') throw new Error('unexpected staging Worker name');
if (staging.workers_dev !== true) throw new Error('staging must stay on workers.dev');
if (staging.vars?.ENVIRONMENT !== 'staging') throw new Error('staging ENVIRONMENT marker missing');
if (staging.vars?.APP_URL !== 'https://splendoria-v2-staging.raoulragazzi.workers.dev') throw new Error('staging APP_URL is not isolated');
if (staging.vars?.APP_URL === config.vars?.APP_URL) throw new Error('staging APP_URL matches production');

const prodDb = config.d1_databases?.find((entry) => entry.binding === 'DB');
const stageDb = staging.d1_databases?.find((entry) => entry.binding === 'DB');
if (!prodDb || !stageDb) throw new Error('DB binding missing');
if (stageDb.database_name !== 'splendoria-v2-test') throw new Error('staging D1 is not the test database');
if (stageDb.database_id === prodDb.database_id) throw new Error('staging D1 points to production database');

if (!Array.isArray(staging.triggers?.crons) || staging.triggers.crons.length !== 0) throw new Error('staging cron must stay disabled');

const emailBindings = new Map((staging.send_email || []).map((entry) => [entry.name, entry]));
if (!emailBindings.has('CONTACT_EMAIL')) throw new Error('staging CONTACT_EMAIL binding missing');
const adminEmail = emailBindings.get('ADMIN_EMAIL_NOTIFICATION');
if (!adminEmail) throw new Error('staging ADMIN_EMAIL_NOTIFICATION binding missing');
if (adminEmail.destination_address !== config.vars?.ADMIN_EMAIL) throw new Error('staging admin email destination drifted');

if (staging.routes || staging.route) throw new Error('staging must not declare production routes');

console.log('staging config: isolated Worker/D1, cron disabled, email bindings explicit');
