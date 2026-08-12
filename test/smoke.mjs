import worker from "../src/worker.js";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

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
  AI: { async run() { return { response: "Le radici\nLa svolta\nIl futuro\nEpilogo" }; } }
};

for (const path of ["/", "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai", "/accedi", "/area-clienti", "/area-amministratore", "/registrati", "/password-dimenticata", "/studio", "/account", "/admin", "/pagina-che-non-esiste"]) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  if (![200, 303, 404].includes(response.status)) throw new Error(`${path}: stato ${response.status}`);
  if (response.status === 200 && !(await response.text()).includes("Splendoria")) throw new Error(`${path}: HTML non valido`);
  console.log(`${path}: ${response.status}`);
}

const canonicalResponse = await worker.fetch(new Request("https://splendoria.vip/area-clienti?da=apice"), env);
if (canonicalResponse.status !== 308 || canonicalResponse.headers.get("location") !== "https://www.splendoria.vip/area-clienti?da=apice") throw new Error("Dominio: reindirizzamento canonico verso www non valido");
if (!canonicalResponse.headers.get("strict-transport-security")?.includes("includeSubDomains")) throw new Error("Sicurezza: HSTS assente dal reindirizzamento canonico");
const legacyBookResponse = await worker.fetch(new Request("https://book.splendoria.vip/vecchio-percorso?x=1"), env);
if (legacyBookResponse.status !== 308 || legacyBookResponse.headers.get("location") !== "https://www.splendoria.vip/") throw new Error("Dominio: sottodominio storico non reindirizzato alla pagina canonica");
console.log("/dominio: host canonico www applicato");

const publicSeoPages = [
  ["/", "La tua vita in un romanzo — Splendoria"],
  ["/guida", "Guida allo Studio — Splendoria"],
  ["/privacy-policy", "Privacy Policy — Splendoria"],
  ["/cookie-policy", "Cookie Policy — Splendoria"],
  ["/termini-condizioni", "Termini e condizioni — Splendoria"],
  ["/note-legali", "Note legali — Splendoria"],
  ["/trasparenza-ai", "Trasparenza sull’intelligenza artificiale — Splendoria"]
];
for (const [path, title] of publicSeoPages) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  const html = await response.text();
  const canonicalUrl = `https://www.splendoria.vip${path}`;
  if (!html.startsWith("<!DOCTYPE html>")) throw new Error(`${path}: dichiarazione HTML5 non canonica`);
  if (response.status !== 200 || !html.includes(`<title>${title}</title>`) || !html.includes(`<link rel="canonical" href="${canonicalUrl}">`)) throw new Error(`${path}: title o canonical non validi`);
  if (!html.includes('name="robots" content="index, follow, max-image-preview:large') || !html.includes('property="og:title"') || !html.includes(`property="og:url" content="${canonicalUrl}"`) || !html.includes('name="twitter:card" content="summary_large_image"')) throw new Error(`${path}: metadata social o robots incompleti`);
  if (!html.includes('property="og:image" content="https://www.splendoria.vip/assets/splendoria-book-hero.webp"') || !html.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"')) throw new Error(`${path}: immagine social o favicon mancanti`);
  if (!response.headers.get("strict-transport-security")?.includes("max-age=31536000") || !response.headers.get("permissions-policy")?.includes("microphone=(self)") || response.headers.get("x-frame-options") !== "DENY") throw new Error(`${path}: header di sicurezza incompleti`);
}

for (const path of ["/accedi", "/registrati", "/area-clienti", "/area-amministratore", "/verifica-amministratore?challenge=test", "/verifica-email?token=test", "/password-dimenticata", "/reimposta-password?token=test"]) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  const html = await response.text();
  if (!html.includes('name="robots" content="noindex, nofollow, noarchive"') || html.includes('rel="canonical"')) throw new Error(`${path}: noindex HTML specifico non applicato`);
  if (response.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive" || !response.headers.get("cache-control")?.includes("no-store")) throw new Error(`${path}: noindex o no-store HTTP non applicati`);
}
const privateRedirectResponse = await worker.fetch(new Request("https://www.splendoria.vip/studio"), env);
if (privateRedirectResponse.status !== 303 || privateRedirectResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive" || !privateRedirectResponse.headers.get("cache-control")?.includes("no-store")) throw new Error("Aree riservate: redirect non protetto da noindex e no-store");

const robotsResponse = await worker.fetch(new Request("https://www.splendoria.vip/robots.txt"), { ...env, DB: { prepare() { throw new Error("DB non deve essere consultato"); } } });
const robotsBody = await robotsResponse.text();
if (robotsResponse.status !== 200 || !robotsResponse.headers.get("content-type")?.includes("text/plain") || !robotsBody.includes("Disallow: /studio") || !robotsBody.includes("Disallow: /libro/") || !robotsBody.includes("Disallow: /account") || !robotsBody.includes("Disallow: /admin") || !robotsBody.includes("Sitemap: https://www.splendoria.vip/sitemap.xml")) throw new Error("SEO: robots.txt incompleto");
const sitemapResponse = await worker.fetch(new Request("https://www.splendoria.vip/sitemap.xml"), { ...env, DB: { prepare() { throw new Error("DB non deve essere consultato"); } } });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200 || !sitemapResponse.headers.get("content-type")?.includes("application/xml") || (sitemapBody.match(/<url>/g) || []).length !== publicSeoPages.length) throw new Error("SEO: sitemap XML non valida");
if (publicSeoPages.some(([path]) => !sitemapBody.includes(`<loc>https://www.splendoria.vip${path}</loc>`)) || ["/studio", "/libro/", "/admin", "/area-clienti"].some(path => sitemapBody.includes(path))) throw new Error("SEO: sitemap non contiene esclusivamente le pagine pubbliche");
const faviconResponse = await worker.fetch(new Request("https://www.splendoria.vip/favicon.ico"), { ...env, DB: { prepare() { throw new Error("DB non deve essere consultato"); } } });
if (faviconResponse.status !== 200 || !faviconResponse.headers.get("content-type")?.includes("image/svg+xml") || !(await faviconResponse.text()).includes("#004225")) throw new Error("SEO: favicon.ico non valida");
const faviconSource = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
if (!faviconSource.includes("#004225") || !faviconSource.includes("#c5a059")) throw new Error("SEO: asset favicon.svg non valido");
const healthResponse = await worker.fetch(new Request("https://www.splendoria.vip/healthz"), env);
const health = await healthResponse.json();
if (healthResponse.status !== 200 || health.status !== "ok" || health.checks?.database !== "ok" || healthResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive" || !healthResponse.headers.get("cache-control")?.includes("no-store")) throw new Error("Operatività: endpoint healthz non valido o indicizzabile");
let publicDatabaseQueries = 0;
const publicWithoutSchemaChecks = await worker.fetch(new Request("https://www.splendoria.vip/"), { ...env, DB: { prepare() { publicDatabaseQueries += 1; throw new Error("La home pubblica non deve interrogare D1 senza sessione"); } } });
if (publicWithoutSchemaChecks.status !== 200 || publicDatabaseQueries !== 0) throw new Error("Prestazioni: la home esegue ancora verifiche D1 non necessarie");
console.log("/seo: sitemap, robots, favicon, canonical, social metadata, noindex e hardening HTTP validi");

const accessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/accedi"), env)).text();
if (!accessHtml.includes('href="/area-clienti"') || !accessHtml.includes('href="/area-amministratore"') || !accessHtml.includes("Scegli la tua area")) throw new Error("Accesso: scelta tra area clienti e amministratore incompleta");
const clientAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-clienti"), env)).text();
if (!clientAccessHtml.includes('action="/area-clienti"') || !clientAccessHtml.includes("Accedi al tuo Studio") || /name="password"[^>]*minlength/.test(clientAccessHtml)) throw new Error("Accesso clienti: schermata o compatibilità password storiche non valida");
const adminAccessHtml = await (await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore"), env)).text();
if (!adminAccessHtml.includes('action="/area-amministratore"') || !adminAccessHtml.includes("sblocco dei pagamenti")) throw new Error("Accesso amministratore: schermata non valida");
console.log("/accesso: schermate cliente e amministratore separate");

const showcaseTypography = await (await worker.fetch(new Request("https://www.splendoria.vip/"), env)).text();
if (!showcaseTypography.includes('class="showcase-page legacy-showcase"') || !showcaseTypography.includes('--font-editorial:"Gentium Book Plus"') || !showcaseTypography.includes("--font-ui:Inter") || !showcaseTypography.includes("--imperial:#004225") || !showcaseTypography.includes("--satin-gold:#c5a059") || !showcaseTypography.includes("--night:#1a1b26")) throw new Error("Vetrina: identità editoriale e palette non applicate");
if (!showcaseTypography.includes("legacy-hero-grid") || !showcaseTypography.includes('src="/assets/splendoria-book-hero.webp"') || !showcaseTypography.includes("La tua vita in un romanzo") || !showcaseTypography.includes("La tua storia destinata a vivere centinaia di anni") || !showcaseTypography.includes("Inizia il tuo libro")) throw new Error("Vetrina: nuova Hero editoriale incompleta");
if (!showcaseTypography.includes('src="/assets/studio.js?v=20260812-3"')) throw new Error("Vetrina: asset JavaScript non versionato contro la cache del browser");
const publicNavigation = showcaseTypography.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (["Come funziona", "Listino", "Contattaci", "Il mio Studio"].some(label => !publicNavigation.includes(label)) || !publicNavigation.includes('href="/#metodo"') || !publicNavigation.includes('href="/#formule"') || !publicNavigation.includes('href="/#contatti"') || publicNavigation.includes("Area amministratore")) throw new Error("Navigazione: menu completo della vetrina assente, destinazioni errate o collegamento amministratore esposto");
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/gentium-book-plus-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`Vetrina: font locale ${weight} non valido`);
}
for (const weight of [400, 700]) {
  const fontResponse = await worker.fetch(new Request(`https://www.splendoria.vip/assets/eb-garamond-${weight}.woff2`), env);
  if (fontResponse.status !== 200 || fontResponse.headers.get("content-type") !== "font/woff2" || (await fontResponse.arrayBuffer()).byteLength < 20000) throw new Error(`PDF: Garamond locale ${weight} non valido`);
}
const heroImage = readFileSync(new URL("../public/assets/splendoria-book-hero.webp", import.meta.url));
if (heroImage.byteLength < 40000 || heroImage.subarray(0, 4).toString() !== "RIFF" || heroImage.subarray(8, 12).toString() !== "WEBP") throw new Error("Vetrina: immagine Hero WebP non valida");
const showcaseSections = [...showcaseTypography.matchAll(/data-showcase-section="([^"]+)"/g)].map(match => match[1]);
const requiredSections = ["hero", "advantages", "comparison", "paths", "method", "markets", "governance", "assessment", "faq", "final-cta"];
if (requiredSections.some(section => !showcaseSections.includes(section)) || new Set(showcaseSections).size !== 10) throw new Error("Vetrina: architettura in dieci sezioni incompleta");
if (!showcaseTypography.includes('data-legacy-slider') || (showcaseTypography.match(/data-legacy-range/g) || []).length !== 2 || !showcaseTypography.includes("Sposta il cursore") || !showcaseTypography.includes("legacy-hint-arrow-left") || !showcaseTypography.includes("legacy-hint-arrow-right") || !showcaseTypography.includes("La stanza della domenica") || !showcaseTypography.includes("L’Opera Splendoria") || !showcaseTypography.includes("Mia nonna sembrava conoscere una geometria segreta")) throw new Error("Vetrina: doppio cursore o trasmutazione letteraria interattiva incompleti");
if (!showcaseTypography.includes("Scala di leggibilità dell'interfaccia") || !showcaseTypography.includes("body{font-size:18px}") || !showcaseTypography.includes(".eyebrow,.table th,.badge,.small,.footer-links a,.legal-check,.legal-updated,.password-hint,.cookie-banner nav a,.table-actions .button{font-size:16px}") || !showcaseTypography.includes(".legal-content p,.legal-content li{font-size:19px}")) throw new Error("Interfaccia: scala tipografica leggibile non applicata alle pagine di servizio");
if (!showcaseTypography.includes("Vetrina: la gerarchia resta editoriale") || !showcaseTypography.includes(".legacy-credentials dt,.legacy-sheet-grid dt,.legacy-path-tone") || !showcaseTypography.includes(".legacy-comparison-table td,.legacy-comparison-table tbody th") || !showcaseTypography.includes(".legacy-section-heading>p") || !showcaseTypography.includes(".legacy-slider-after blockquote{font-size:clamp(20px,1.6vw,24px)!important}") || !showcaseTypography.includes(".legacy-showcase .navlinks>a{white-space:nowrap;font-size:16px!important}")) throw new Error("Vetrina: corpi minuti o soglia mobile da 16 px non applicati");
if (!showcaseTypography.includes('data-editorial-assessment') || !showcaseTypography.includes("Dimensione della trama del libro") || !showcaseTypography.includes("Nodi cruciali") || !showcaseTypography.includes("Estrazione Muse") || !showcaseTypography.includes("Scheda Tecnica del Progetto Editoriale") || !showcaseTypography.includes("Stampa o salva in PDF")) throw new Error("Vetrina: Assessment Editoriale o Scheda Tecnica incompleti");
if (!showcaseTypography.includes("Le Muse ti guidano") || !showcaseTypography.includes("Quattro livelli di controllo") || !showcaseTypography.includes("I tuoi racconti rimangono segreti")) throw new Error("Vetrina: guida delle Muse o livelli di controllo incompleti");
if (["Casa editoriale della memoria", "Una storia destinata a restare", "Inizia il tuo Retaggio", "Governance operativa 7Agent", "“7Agent” identifica", "Protezione del dato", "Splendoria o il precipizio del testo indistinto", "La memoria non chiede di essere celebrata"].some(text => showcaseTypography.includes(text))) throw new Error("Vetrina: una o più formulazioni precedenti sono ancora pubblicate");
if (!showcaseTypography.includes("Dati custoditi nell’infrastruttura Splendoria") || !showcaseTypography.includes("Progetto conservato su Splendoria D1 con accessi separati") || !showcaseTypography.includes("Account, progetti, capitoli e interviste sono conservati nell’infrastruttura Splendoria") || !showcaseTypography.includes("La bellezza di poter finalmente trasmettere una visione")) throw new Error("Vetrina: riferimenti a Splendoria o chiusura finale incompleti");
if (!showcaseTypography.includes("La forza della tradizione") || !showcaseTypography.includes("gesti, fallimenti, errori e visioni") || !showcaseTypography.includes("Tre possibilità, una grande cura editoriale") || !showcaseTypography.includes("Fino a 100 pagine · 12 capitoli") || !showcaseTypography.includes("Fino a 120 pagine · 18 capitoli") || !showcaseTypography.includes("La prima architettura del tuo libro")) throw new Error("Vetrina: copy editoriale o pagine dei percorsi non aggiornati");
if (!showcaseTypography.includes('<a class="skip-link" href="#main-content">Vai al contenuto principale</a>') || !showcaseTypography.includes('<main id="main-content" tabindex="-1">') || !showcaseTypography.includes(":focus-visible{outline:3px solid") || !showcaseTypography.includes("prefers-reduced-motion:reduce")) throw new Error("Accessibilità: navigazione da tastiera, focus o riduzione del movimento incompleti");
if (showcaseTypography.includes("Retaggio") || showcaseTypography.includes("Fino a 250 pagine") || showcaseTypography.includes("Non un preventivo")) throw new Error("Vetrina: copy precedente ancora presente");
if (showcaseTypography.includes("Retaggio Editoriale Certificato") || showcaseTypography.includes("scritta dai maestri") || showcaseTypography.includes("ROI Storico")) throw new Error("Vetrina: promessa commerciale non dimostrabile ancora pubblicata");
if (showcaseTypography.includes("IT05Z0538758590000049304579")) throw new Error("Vetrina: coordinate bancarie esposte fuori dall’area riservata");
console.log("/vetrina: dieci sezioni, Hero, slider, governance e Assessment disponibili");

const guideResponse = await worker.fetch(new Request("https://www.splendoria.vip/guida"), env);
const guideHtml = await guideResponse.text();
if (guideResponse.status !== 200 || !guideHtml.includes("Il tuo libro, un passo alla volta") || !guideHtml.includes("260–460 parole") || !guideHtml.includes("siamo usciti") || !guideHtml.includes("Prova gratuita e sblocco") || !guideHtml.includes("data-print-guide")) throw new Error("Guida: manuale self-service, grammatica o diagnostica incompleti");
console.log("/guida: manuale operativo e stampabile disponibile");

const wranglerConfig = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
if (!wranglerConfig.includes('"database_name": "splendoria-db"') || !wranglerConfig.includes('"database_id": "1a46b8b0-2e6f-44cf-a22f-4950259f9434"') || !wranglerConfig.includes('"APP_URL": "https://www.splendoria.vip"') || !wranglerConfig.includes('"directory": "./public"') || !wranglerConfig.includes('"name": "ADMIN_EMAIL_NOTIFICATION"') || !wranglerConfig.includes('"destination_address": "raoulragazzi@gmail.com"') || !wranglerConfig.includes('"crons": ["*/5 * * * *"]') || !wranglerConfig.includes('"migrations_dir": "./migrations"') || !wranglerConfig.includes('"observability"') || !wranglerConfig.includes('"head_sampling_rate": 1')) throw new Error("Cloudflare: configurazione di produzione, migrazioni, osservabilità, email o asset statici non valida");
if (wranglerConfig.includes('"database_name": "splendoria-v2-test"') || wranglerConfig.includes("splendoria-v2.raoulragazzi.workers.dev")) throw new Error("Cloudflare: riferimenti all’ambiente di test ancora attivi");
console.log("/configurazione: database e URL di produzione attivi");

const workerSource = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../migrations/0001_current_schema.sql", import.meta.url), "utf8");
const adminSecurityMigrationSource = readFileSync(new URL("../migrations/0002_admin_login_challenge.sql", import.meta.url), "utf8");
const emailVerificationMigrationSource = readFileSync(new URL("../migrations/0003_email_verification.sql", import.meta.url), "utf8");
const auditMigrationSource = readFileSync(new URL("../migrations/0004_audit_events.sql", import.meta.url), "utf8");
for (const table of ["User", "BookProject", "BookChapter", "BookInterview", "Session", "RegistrationNotification"]) {
  if (!workerSource.includes(`INSERT INTO "${table}"`)) throw new Error(`Cloudflare D1: scrittura persistente ${table} non trovata`);
}
if (!migrationSource.includes('CREATE TABLE IF NOT EXISTS "RegistrationNotification"') || !workerSource.includes("retryRegistrationNotifications") || !workerSource.includes("async scheduled")) throw new Error("Registrazione: tracciamento D1 o ritento automatico della notifica incompleto");
if (!adminSecurityMigrationSource.includes('CREATE TABLE IF NOT EXISTS "AdminLoginChallenge"') || !workerSource.includes("startAdminLoginChallenge") || !workerSource.includes("verifyAdminLogin")) throw new Error("Amministrazione: migrazione o secondo fattore email incompleto");
if (!emailVerificationMigrationSource.includes('ALTER TABLE "User" ADD COLUMN "emailVerifiedAt"') || !emailVerificationMigrationSource.includes('CREATE TABLE IF NOT EXISTS "EmailVerification"') || !workerSource.includes("sendWelcomeVerificationEmail") || !workerSource.includes("museActionPath")) throw new Error("Registrazione: verifica email, benvenuto o blocco della Musa incompleti");
if (!auditMigrationSource.includes('CREATE TABLE IF NOT EXISTS "AuditEvent"') || !auditMigrationSource.includes('"actorHash"') || !auditMigrationSource.includes('"targetHash"') || !workerSource.includes("recordAuditEvent") || !workerSource.includes("pruneAuditEvents")) throw new Error("Audit: migrazione, minimizzazione o scadenza automatica incomplete");
if (!migrationSource.includes('"sourceMaterial" TEXT NOT NULL DEFAULT') || !workerSource.includes("hasRepeatedPassages") || !workerSource.includes("italianGrammarIssues") || !workerSource.includes("ITALIAN_LANGUAGE_STANDARD") || !workerSource.includes("MUSE_WRITER_SYSTEM") || !workerSource.includes("MUSE_EDITOR_SYSTEM") || !workerSource.includes("@cf/meta/llama-3.3-70b-instruct-fp8-fast")) throw new Error("Muse: fonti, modello letterario o controllo qualità automatico incompleti");
const fetchHandlerSource = workerSource.slice(workerSource.indexOf("async fetch(request, env)"), workerSource.indexOf("async email(message, env)"));
if (/ensureSchema|ensureRegistrationNotificationSchema|ensureColumn/.test(fetchHandlerSource) || /async function ensureSchema|async function ensureColumn/.test(workerSource)) throw new Error("Prestazioni: controlli o modifiche dello schema D1 ancora eseguiti dal Worker");
if (!schemaSource.includes('"statoCommerciale" TEXT NOT NULL DEFAULT \'prova_gratuita\'') || !workerSource.includes('"prova_gratuita"') || !workerSource.includes("IT05Z0538758590000049304579")) throw new Error("Prova gratuita: stato commerciale o coordinate di pagamento mancanti");
const localStorageKeys = [...workerSource.matchAll(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)/g)].map(match => match[1]);
const unexpectedLocalStorage = localStorageKeys.filter(key => !["splendoria-cookie-notice-v1", "splendoria-voice-language"].includes(key));
if (unexpectedLocalStorage.length || !workerSource.includes("HttpOnly; Secure; SameSite=Lax")) throw new Error("Persistenza: dati utente o libro esposti nel dispositivo locale");
console.log("/persistenza: utenti, libri, capitoli, interviste e sessioni su Cloudflare D1; in locale solo preferenze tecniche");

const pricingResponse = await worker.fetch(new Request("https://www.splendoria.vip/?formula=complete"), env);
const pricingHtml = await pricingResponse.text();
if (!pricingHtml.includes("Digital") || !pricingHtml.includes("Premium") || !pricingHtml.includes("Signature")) throw new Error("Listino: formule mancanti");
if (!pricingHtml.includes("1.000 €") || !pricingHtml.includes("1.900 €") || !pricingHtml.includes("2.500 €") || !pricingHtml.includes("10 copie cartacee")) throw new Error("Listino: prezzi o contenuti principali non validi");
if (!pricingHtml.includes("Sempre incluso in ogni percorso") || !pricingHtml.includes("Primo capitolo gratuito, Studio di scrittura riservato") || !pricingHtml.includes("PDF A5 pronto per la stampa")) throw new Error("Listino: fascia dei servizi sempre inclusi incompleta");
if (!pricingHtml.includes("Percorso intimo") || !pricingHtml.includes("Percorso approfondito") || !pricingHtml.includes("Edizione su misura") || !pricingHtml.includes("Il più scelto")) throw new Error("Listino: posizionamento dei tre percorsi incompleto");
if (!pricingHtml.includes("PDF editoriale A5 pronto per la lettura e per la stampa") || !pricingHtml.includes("Maggiore profondità narrativa e attenzione alla voce dell’autore") || !pricingHtml.includes("10 copie rilegate con finiture definite nel progetto")) throw new Error("Listino: promesse distintive delle formule incomplete");
if ((pricingHtml.match(/Crea gratuitamente il primo capitolo/g) || []).length !== 2 || !pricingHtml.includes("Raccontaci il tuo progetto")) throw new Error("Listino: inviti all’azione non coerenti con il percorso gratuito e Signature");
if (!pricingHtml.includes("può essere concordato un accompagnamento editoriale della Scuola Holden, con proposta separata")) throw new Error("Listino: precisazione Scuola Holden incompleta");
if (!pricingHtml.includes('<option value="complete" selected>Splendoria Premium · 1.900 €</option>')) throw new Error("Listino: formula Premium non riportata nel configuratore");
if (pricingHtml.includes("marcatura temporale") || pricingHtml.includes("deposito digitale") || pricingHtml.includes("versione digitale revisionata e depositata") || pricingHtml.includes("ricevi subito le tue credenziali") || pricingHtml.includes("fino a sei pagine")) throw new Error("Vetrina: contiene ancora promesse non implementate o incoerenti con lo Studio");
if (["Tonalità intima", "Tonalità giornalistica", "Tonalità epica", "Per vite d’inchiesta", "Organizzazione di fotografie e documenti", "Supervisione umana e PDF editoriale"].some(text => pricingHtml.includes(text))) throw new Error("Listino: una o più formulazioni precedenti sono ancora pubblicate");
if (pricingHtml.includes("Hybrid") || pricingHtml.includes("Premium Short Book") || pricingHtml.includes("Personal Branding &amp; Corporate")) throw new Error("Listino: denominazioni precedenti ancora presenti");
if (pricingHtml.includes("prime 5 copie") || pricingHtml.includes("consegna entro 10 giorni")) throw new Error("Listino: promesse della precedente offerta ancora presenti");
if (!pricingHtml.includes("Partita IVA 02950290219") || !pricingHtml.includes('href="/privacy-policy"') || !pricingHtml.includes('href="/cookie-policy"')) throw new Error("Informazioni legali: P.IVA o collegamenti del footer mancanti");
if (pricingHtml.includes("Merano") || pricingHtml.includes("Via J. W. von Goethe")) throw new Error("Informazioni legali: vecchio indirizzo ancora presente");
if (!pricingHtml.includes("Via Settala 22–24, Milano (MI)")) throw new Error("Informazioni legali: indirizzo di Milano mancante");
if (!pricingHtml.includes('name="privacyRead"') || !pricingHtml.includes("Ho letto la")) throw new Error("Contatti: presa visione della Privacy Policy mancante");
if (!pricingHtml.includes('data-cookie-banner') || !pricingHtml.includes("Ho capito e continuo") || !pricingHtml.includes("Non utilizziamo cookie pubblicitari o di profilazione")) throw new Error("Privacy: banner informativo cookie mancante");
console.log("/formule: listino coerente e selezione Assessment disponibili");

const legalChecks = [
  ["/privacy-policy", ["Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)", "infrastruttura Splendoria", "Diritti dell’interessato", "esportare in formato leggibile", "profilo anonimizzato"]],
  ["/cookie-policy", ["Via Settala 22–24, Milano (MI)", "spl_session", "splendoria-voice-language", "splendoria-cookie-notice-v1", "non installa cookie pubblicitari"]],
  ["/termini-condizioni", ["Diritto di recesso", "Termini e condizioni", "conferma scritta di Splendoria"]],
  ["/note-legali", ["Note legali", "Raoul Ragazzi", "02950290219", "Via Settala 22–24, Milano (MI)"]],
  ["/trasparenza-ai", ["Stai interagendo con un sistema di intelligenza artificiale", "supervisione umana"]]
];
for (const [path, expected] of legalChecks) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`), env);
  const html = await response.text();
  if (response.status !== 200 || expected.some(text => !html.includes(text))) throw new Error(`${path}: informativa incompleta`);
}
const registrationResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati"), env);
const registrationHtml = await registrationResponse.text();
if (!registrationHtml.includes('name="privacyRead"') || !registrationHtml.includes('href="/privacy-policy"') || !registrationHtml.includes('name="passwordConfirm"') || !registrationHtml.includes('name="nome" type="text"') || !registrationHtml.includes('data-password-visibility') || !registrationHtml.includes('type="submit"') || !registrationHtml.includes("almeno 10 caratteri")) throw new Error("Registrazione: campi, conferma, visibilità password o presa visione Privacy mancanti");
console.log("/informative: pagine, footer e prese visione legali disponibili");

const studioJs = await worker.fetch(new Request("https://www.splendoria.vip/assets/studio.js"), env);
const studioJsBody = await studioJs.text();
if (studioJs.status !== 200 || !studioJs.headers.get("content-type")?.includes("javascript") || !studioJsBody.includes("SpeechRecognition") || !studioJsBody.includes("data-plan-choice") || !studioJsBody.includes("data-print-book") || !studioJsBody.includes("window.print()")) throw new Error("Asset JavaScript: funzionalità non valide");
if (!studioJsBody.includes("splendoria-writing-position") || !studioJsBody.includes("sessionStorage") || !studioJsBody.includes("data-keep-writing-position")) throw new Error("Muse: mantenimento della posizione di scrittura non disponibile");
if (!studioJsBody.includes("it-IT") || !studioJsBody.includes("de-DE") || !studioJsBody.includes("en-GB") || !studioJsBody.includes("splendoria-voice-language")) throw new Error("Asset JavaScript: lingue della dettatura non valide");
if ((studioJsBody.match(/new SpeechRecognition\(\)/g) || []).length !== 1 || !studioJsBody.includes("const mergeRecognitionText") || !studioJsBody.includes("const recognitionSegments = new Map()") || !studioJsBody.includes("recognitionSegments.set(i") || studioJsBody.includes("finalSegments") || studioJsBody.includes("finalText +=") || !studioJsBody.includes("/api/musa/trascrizione")) throw new Error("Muse: dettatura può duplicare i segmenti o non corregge fedelmente la trascrizione");
const mergeHelperStart = studioJsBody.indexOf("const speechWords =");
const mergeHelperEnd = studioJsBody.indexOf("const setStatus =", mergeHelperStart);
if (mergeHelperStart < 0 || mergeHelperEnd < 0) throw new Error("Muse: funzione di unione dei segmenti vocali non trovata");
const mergeRecognitionText = new Function(`${studioJsBody.slice(mergeHelperStart, mergeHelperEnd)}; return mergeRecognitionText;`)();
const spokenOnce = "Mi chiamo Raoul e vivo a Milano";
let mergedSpeech = "";
for (const repeatedBrowserResult of [spokenOnce, spokenOnce, spokenOnce]) mergedSpeech = mergeRecognitionText(mergedSpeech, repeatedBrowserResult);
if (mergedSpeech !== spokenOnce) throw new Error("Muse: lo stesso risultato vocale viene ancora scritto più volte");
const cumulativeSpeech = mergeRecognitionText("Mi chiamo Raoul", "Mi chiamo Raoul e vivo a Milano");
if (cumulativeSpeech !== spokenOnce || mergeRecognitionText(cumulativeSpeech, "vivo a Milano") !== spokenOnce) throw new Error("Muse: i risultati vocali cumulativi o sovrapposti vengono duplicati");
if (!studioJsBody.includes("data-password-visibility") || !studioJsBody.includes("setCustomValidity") || !studioJsBody.includes("splendoria-cookie-notice-v1") || !studioJsBody.includes("data-chapter-notice")) throw new Error("Asset JavaScript: password visibile, conferma, banner cookie o stato della Musa non funzionanti");
if (!workerSource.includes('data-muse-progress role="status"') || !studioJsBody.includes("museActionPathname") || !studioJsBody.includes("beginMuseProgress") || !studioJsBody.includes("Controlla grammatica, sintassi e fluidità") || !studioJsBody.includes("event.defaultPrevented") || !studioJsBody.includes("data-muse-was-disabled")) throw new Error("Muse: avanzamento accessibile o protezione dai doppi invii incompleti");
if (!studioJsBody.includes("data-book-preview") || !studioJsBody.includes("data-book-tab") || !studioJsBody.includes("IntersectionObserver") || !studioJsBody.includes("prefers-reduced-motion")) throw new Error("Asset JavaScript: anteprima del libro o animazioni accessibili mancanti");
if (!studioJsBody.includes("data-legacy-range") || !studioJsBody.includes("data-editorial-assessment") || !studioJsBody.includes("renderAssessment") || !studioJsBody.includes("Indice editoriale orientativo")) throw new Error("Asset JavaScript: slider o generazione della Scheda Tecnica mancanti");
if (!studioJsBody.includes("paginateLiveChapter") || !studioJsBody.includes("livePageForCursor") || !studioJsBody.includes("data-live-chapter") || !studioJsBody.includes("data-live-content") || !studioJsBody.includes("renderLiveChapter(true)")) throw new Error("Studio: anteprima del capitolo non si aggiorna in tempo reale");
if (!studioJsBody.includes("muse-horizontal") || !studioJsBody.includes("chapter-navigator") || !studioJsBody.includes("renderActiveChapter") || !studioJsBody.includes("Salva e passa al capitolo successivo") || !studioJsBody.includes("Altri interventi editoriali")) throw new Error("Studio: Musa orizzontale, capitolo singolo o navigazione editoriale non disponibili");
if (!studioJsBody.includes("/autosalva") || !studioJsBody.includes("Le tue parole sono al sicuro") || !studioJsBody.includes("Sto custodendo le tue parole") || !studioJsBody.includes("8000")) throw new Error("Studio: salvataggio automatico del capitolo non disponibile");
if (!studioJsBody.includes("/autosalva-progetto") || !studioJsBody.includes("Ricordi al sicuro") || !studioJsBody.includes("project-save-status") || !studioJsBody.includes("6000")) throw new Error("Studio: salvataggio automatico dei ricordi iniziali non disponibile");
const livePreviewHelperStart = studioJsBody.indexOf("const livePreviewWordsPerPage =");
const livePreviewHelperEnd = studioJsBody.indexOf("document.querySelectorAll('[data-live-chapter]')", livePreviewHelperStart);
if (livePreviewHelperStart < 0 || livePreviewHelperEnd < 0) throw new Error("Studio: paginatore dell’anteprima A5 non trovato");
const paginateLiveChapter = new Function(`${studioJsBody.slice(livePreviewHelperStart, livePreviewHelperEnd)}; return paginateLiveChapter;`)();
const livePreviewPages = paginateLiveChapter(Array.from({ length: 500 }, (_, index) => `parola${index + 1}`).join(" "));
if (livePreviewPages.length !== 3 || livePreviewPages.flatMap(page => page.join(" ").split(/\s+/)).length !== 500) throw new Error("Studio: suddivisione in pagine dell’anteprima in tempo reale non valida");
console.log("/assets/studio.js: dettatura, slider, Assessment e animazioni accessibili disponibili");

const museUser = { id: "cliente-muse", email: "muse@example.com", nome: "Cliente Muse" };
const groundedChapterMaterial = Array.from({ length: 60 }, (_, sentenceIndex) => Array.from({ length: 25 }, (_, wordIndex) => `dato${sentenceIndex * 25 + wordIndex + 1}`).join(" ") + ".").join(" ");
const museProject = {
  id: "libro-muse", userId: museUser.id, title: "La mia storia", genre: "Autobiografia",
  tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: 100,
  sourceMaterial: `Nel 1987 vivevo a Milano con mia nonna Anna, in via Verdi. ${groundedChapterMaterial}`,
  story: "Sono nato a Milano e ricordo la casa di mia nonna Anna.", people: "Mia nonna Anna", events: "Le estati trascorse nella sua casa", message: "Custodire i ricordi di famiglia", status: "bozza", plan: "free"
};
const museChapter = { id: "capitolo-muse", projectId: museProject.id, position: 1, title: "Il primo ricordo", content: "Un capitolo già iniziato.", status: "generato" };
const museInterview = { projectId: museProject.id, questions: "Quale immagine ricordi della casa di tua nonna?\nChe cosa ti ha insegnato tua nonna?", answers: "" };
const museChapterUpdates = [];
const museProjectUpdates = [];
const museInterviewUpdates = [];
const museBatches = [];
const museDb = {
  prepare(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes('UPDATE "BookChapter" SET title=?,content=?')) museChapterUpdates.push(this.values);
        if (sql.includes('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?')) museProjectUpdates.push(this.values);
        if (sql.includes('UPDATE "BookInterview" SET answers=?')) museInterviewUpdates.push(this.values);
        return { success: true };
      },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: [museChapter] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return museUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return museProject;
        if (sql.includes('FROM "BookChapter"')) return museChapter;
        if (sql.includes('FROM "BookInterview"')) return museInterview;
        return null;
      }
    };
  },
  async batch(statements) { museBatches.push(statements.length); const results=[]; for(const statement of statements)results.push(await statement.run()); return results; }
};
const museResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse", { headers: { cookie: "spl_session=test" } }), { ...env, DB: museDb });
const museHtml = await museResponse.text();
if (museResponse.status !== 200 || !museHtml.includes("Racconta con la tua voce") || !museHtml.includes("data-voice-language")) throw new Error("Muse: nuova sezione non disponibile");
if (!museHtml.includes('<option value="it-IT">Italiano</option>') || !museHtml.includes('<option value="de-DE">Deutsch</option>') || !museHtml.includes('<option value="en-GB">English</option>')) throw new Error("Muse: selettore trilingue non valido");
if (!museHtml.includes('aria-live="polite"')) throw new Error("Muse: stato della dettatura non accessibile");
if (!museHtml.includes("Trasparenza IA") || !museHtml.includes("Gli output restano modificabili") || !museHtml.includes('name="specialDataConsent"')) throw new Error("Muse: trasparenza IA o consenso ai dati particolari mancante");
if (!museHtml.includes("scrittura ed editing di livello universitario") || !museHtml.includes("grammatica, sintassi, lessico, ritmo e fluidità") || !museHtml.includes("rilegge la bozza")) throw new Error("Muse: profilo editoriale avanzato non spiegato nello Studio");
if (!museHtml.includes("DAMMI ALTRI DATI E FATTI") || !museHtml.includes('name="sourceMaterial"') || !museHtml.includes("date, luoghi, nomi e ruoli dei personaggi")) throw new Error("Muse: campo per dati, fatti, date e personaggi non disponibile");
if (!museHtml.includes('id="chapter-card-capitolo-muse"') || !museHtml.includes('data-keep-writing-position') || !museHtml.includes('data-book-path="/libro/libro-muse"')) throw new Error("Muse: capitolo non predisposto a mantenere la posizione");
if (!museHtml.includes('Titolo del capitolo') || !museHtml.includes('name="title" value="Il primo ricordo"')) throw new Error("Studio: titolo del capitolo non modificabile");
if (!museHtml.includes('data-live-chapter') || !museHtml.includes(">ANTEPRIMA</h4>") || museHtml.includes("Anteprima PDF in tempo reale") || museHtml.includes("Il capitolo mentre prende forma") || !museHtml.includes('data-live-title') || !museHtml.includes('data-live-page-status') || !museHtml.includes('data-live-prev') || !museHtml.includes('data-live-next') || !museHtml.includes("A5 · Garamond") || !museHtml.includes("Apri l’anteprima completa") || !museHtml.includes("calc(.93vw + 2.667px)")) throw new Error("Studio: anteprima A5 del singolo capitolo incompleta");
if (!museHtml.includes("--studio-type-small:16px;--studio-type-body:18px;--studio-type-reading:22px") || !museHtml.includes("min-height:680px") || !museHtml.includes("min-height:380px") || !museHtml.includes("min-height:260px")) throw new Error("Studio: campi più grandi o gerarchia tipografica a tre misure non applicati");
if (!museHtml.includes("12 capitoli · circa 7 pagine ciascuno") || !museHtml.includes("18 capitoli · circa 6–7 pagine ciascuno") || !museHtml.includes("Avanzamento del libro") || !museHtml.includes("pagine stimate")) throw new Error("Studio: strutture o avanzamento parole/pagine mancanti");
const improveButtonCount = (museHtml.match(/✦ Migliora/g) || []).length;
const museDraftButtonCount = (museHtml.match(/>Affidati alla Musa<\/button>/g) || []).length;
if (improveButtonCount < 7 || museDraftButtonCount !== improveButtonCount || !museHtml.includes('formaction="/libro/libro-muse/migliora"') || !museHtml.includes('formaction="/libro/libro-muse/affidati"') || !museHtml.includes('formaction="/libro/libro-muse/risposte/affidati"') || !museHtml.includes('value="improve"')) throw new Error("Muse: Migliora e Affidati alla Musa non sono affiancati in tutti i campi di scrittura");
if (!museHtml.includes('id="intervista-narrativa"') || !museHtml.includes("Affida queste risposte alla Musa")) throw new Error("Muse: generazione contestuale dell'intera intervista non disponibile");
const chapterSaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/salva", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ title: "Il titolo aggiornato", content: "Il testo aggiornato del capitolo." })
}), { ...env, DB: museDb });
if (chapterSaveResponse.status !== 303 || chapterSaveResponse.headers.get("location") !== "/libro/libro-muse#chapter-card-capitolo-muse") throw new Error("Studio: ritorno al capitolo modificato non valido");
if (!museChapterUpdates.some(values => values[0] === "Il titolo aggiornato" && values[1] === "Il testo aggiornato del capitolo.")) throw new Error("Studio: nuovo titolo del capitolo non salvato in Cloudflare D1");
const chapterAutosaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/autosalva", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ title: "Titolo custodito automaticamente", content: "Queste parole sono state salvate senza interrompere la scrittura." })
}), { ...env, DB: museDb });
const chapterAutosave = await chapterAutosaveResponse.json();
if (chapterAutosaveResponse.status !== 200 || !chapterAutosave.ok || chapterAutosave.words !== 9 || !chapterAutosave.savedAt) throw new Error(`Studio: risposta dell’autosalvataggio non valida (${chapterAutosaveResponse.status}: ${JSON.stringify(chapterAutosave)})`);
if (!museChapterUpdates.some(values => values[0] === "Titolo custodito automaticamente" && values[1] === "Queste parole sono state salvate senza interrompere la scrittura." && values[4] === "capitolo-muse" && values[5] === "libro-muse")) throw new Error("Studio: autosalvataggio non scritto in D1 sul capitolo corretto");
const dictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "ciao mi chiamo Anna e ho 72 anni", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ciao, mi chiamo Anna e ho 72 anni." }; } } });
const correctedDictation = await dictationResponse.json();
if (dictationResponse.status !== 200 || correctedDictation.text !== "Ciao, mi chiamo Anna e ho 72 anni.") throw new Error("Muse: trascrizione fedele con sole correzioni grammaticali non valida");
const repeatedDictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "ciao mi chiamo Anna e ho 72 anni ciao mi chiamo Anna e ho 72 anni ciao mi chiamo Anna e ho 72 anni", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ciao, mi chiamo Anna e ho 72 anni." }; } } });
const repeatedDictation = await repeatedDictationResponse.json();
if (repeatedDictationResponse.status !== 200 || repeatedDictation.text !== "Ciao, mi chiamo Anna e ho 72 anni.") throw new Error("Muse: la correzione della dettatura non elimina la triplicazione accidentale");
const fallbackDictationResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/json" },
  body: JSON.stringify({ text: "questa frase compare tre volte questa frase compare tre volte questa frase compare tre volte", language: "it-IT" })
}), { ...env, DB: museDb, AI: { async run() { throw new Error("AI non disponibile"); } } });
const fallbackDictation = await fallbackDictationResponse.json();
if (fallbackDictation.text !== "Questa frase compare tre volte.") throw new Error("Muse: la rimozione delle ripetizioni dipende ancora dalla disponibilità dell'AI");
const improveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/migliora", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ improveField: "story", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: "sono nato a Milano e ricordo la casa di mia nonna sono nato a Milano e ricordo la casa di mia nonna sono nato a Milano e ricordo la casa di mia nonna", people: "", events: "", message: "", specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Sono nato a Milano e ricordo con chiarezza la casa accogliente di mia nonna." }; } } });
const improvedProject = museProjectUpdates.find(values => values[3] === 84 && values[5]?.includes("con chiarezza"));
if (improveResponse.status !== 303 || !improvedProject || (improvedProject[5].match(/Sono nato a Milano/g) || []).length !== 1) throw new Error("Muse: Migliora non corregge o non elimina le ripetizioni prima di salvare nel progetto D1");
const projectDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ museField: "events", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: "Sono nato a Milano e ogni estate tornavo nella casa di mia nonna Anna.", people: "Mia nonna Anna", events: "", message: "Custodire i ricordi di famiglia", specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ricordo come momento decisivo le estati trascorse nella casa di mia nonna Anna a Milano, dove imparavo a custodire i ricordi di famiglia." }; } } });
if (projectDraftResponse.status !== 303 || !museProjectUpdates.some(values => values[7]?.includes("momento decisivo"))) throw new Error("Muse: Affidati alla Musa non genera e salva una bozza contestuale nel campo del progetto");
let regenerationCalls = 0;
const regeneratedDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ museField: "events", title: "La mia storia", tone: "Emozionante e autentico", audience: "Famiglia e amici", targetPages: "84", sourceMaterial: museProject.sourceMaterial, story: museProject.story, people: museProject.people, events: "", message: museProject.message, specialDataConsent: "yes" })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  regenerationCalls += 1;
  return { response: regenerationCalls === 1 ? "Milano e Anna restano nel ricordo della casa. Milano e Anna restano nel ricordo della casa." : "Ricordo come momento decisivo le estati trascorse a Milano nella casa di mia nonna Anna: lì ho compreso quanto fosse importante custodire i ricordi della nostra famiglia." };
} } });
const regeneratedProject = museProjectUpdates[museProjectUpdates.length - 1] || [];
if (regeneratedDraftResponse.status !== 303 || regenerationCalls !== 2 || !regeneratedProject[7]?.includes("momento decisivo") || regeneratedProject[7]?.includes("Milano e Anna restano")) throw new Error("Muse: una bozza ripetitiva non viene rigenerata automaticamente prima del salvataggio");
const singleAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "Ricordo la casa di mia nonna Anna a Milano, dove trascorrevo le estati della mia infanzia." }; } } });
if (singleAnswerResponse.status !== 303 || singleAnswerResponse.headers.get("location") !== "/libro/libro-muse#interview-step-0" || !museInterviewUpdates.some(values => values[0]?.includes("Ricordo la casa di mia nonna Anna"))) throw new Error("Muse: Affidati alla Musa non genera la singola risposta contestuale");
const secondAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "1", answer_0: "Ricordo la casa di mia nonna Anna a Milano.", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  return { response: options.messages?.[0]?.content?.includes("controllo qualità editoriale") ? "APPROVATO" : "Mia nonna Anna mi ha insegnato che custodire i ricordi della famiglia significa conservarne il valore nel tempo." };
} } });
if (secondAnswerResponse.status !== 303 || secondAnswerResponse.headers.get("location") !== "/libro/libro-muse#interview-step-1" || !museInterviewUpdates.some(values => values[0]?.includes("Domanda 2:") && values[0]?.includes("conservarne il valore nel tempo"))) throw new Error("Muse: generazione non stabile su una seconda domanda contestuale");
const sparseProject = {
  ...museProject, id: "libro-ferrari", title: "Ferrari Trento", sourceMaterial: "", story: "", people: "", events: "", message: ""
};
const sparseQuestion = "In che modo l'incontro con il gusto unico delle bollicine Ferrari Trento ha influenzato il tuo legame con la tradizione e la cultura italiana, e come ti ha fatto sentire parte di qualcosa di più grande?";
const sparseInterview = { projectId: sparseProject.id, questions: sparseQuestion, answers: "" };
const sparseDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes('UPDATE "BookInterview" SET answers=?')) sparseInterview.answers = this.values[0];
        return { success: true };
      },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: [] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return museUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return sparseProject;
        if (sql.includes('FROM "BookInterview"')) return sparseInterview;
        return null;
      }
    };
  },
  async batch(statements) { const results=[]; for(const statement of statements)results.push(await statement.run()); return results; }
};
const sparseDraft = "L'incontro con il gusto unico delle bollicine Ferrari Trento ha rafforzato il mio legame con la tradizione e la cultura italiana. In quel gusto riconosco un sapere che appartiene a una storia condivisa: per questo mi sento parte di qualcosa di più grande, capace di unire memoria, territorio e cultura.";
let sparseAnswerAiCalls = 0;
const sparseAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "" })
}), { ...env, DB: sparseDb, AI: { async run() { sparseAnswerAiCalls += 1; return { response: sparseDraft }; } } });
const sparseAnswerHtml = await sparseAnswerResponse.text();
if (sparseAnswerResponse.status !== 200 || sparseAnswerAiCalls !== 0 || sparseInterview.answers || !sparseAnswerHtml.includes("La domanda orienta l’intervista") || !sparseAnswerHtml.includes("non può essere usata come fonte")) throw new Error("Muse: una domanda con premesse non confermate viene ancora trasformata in una falsa risposta autobiografica");
const sparseEditorResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari", { headers: { cookie: "spl_session=test" } }), { ...env, DB: sparseDb });
const sparseEditorHtml = await sparseEditorResponse.text();
if (sparseEditorResponse.status !== 200 || !sparseEditorHtml.includes('id="interview-0"') || !sparseEditorHtml.includes("qualcosa di più grande")) throw new Error("Muse: la risposta generata viene salvata ma non ricompare nel campo corrispondente");
let recoveryCalls = 0;
sparseProject.sourceMaterial = "Ferrari Trento è un vino che ho assaggiato durante una degustazione reale. In quell’occasione ho pensato alla tradizione italiana e al valore della cultura condivisa con le persone presenti.";
const safeRescueDraft = "Il gusto delle bollicine Ferrari Trento mi avvicina alla tradizione e alla cultura italiana. Vi riconosco un legame con una storia condivisa, e proprio questo legame mi fa sentire parte di qualcosa di più grande.";
const rescuedAnswerResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-ferrari/risposte/affidati", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ generateAnswer: "0", answer_0: "" })
}), { ...env, DB: sparseDb, AI: { async run(_model, options) {
  recoveryCalls += 1;
  if (recoveryCalls === 1) throw new Error("Workers AI temporaneamente non disponibile");
  return { response: safeRescueDraft };
} } });
if (rescuedAnswerResponse.status !== 303 || recoveryCalls !== 2 || !sparseInterview.answers.includes(safeRescueDraft)) throw new Error("Muse: non recupera da un errore temporaneo senza superare due chiamate IA");
const allAnswersResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/risposte", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ answer_0: "", answer_1: "" })
}), { ...env, DB: museDb, AI: { async run() { return { response: "RISPOSTA 1: Ricordo la casa di mia nonna Anna a Milano, dove trascorrevo le estati della mia infanzia.\n\nRISPOSTA 2: Mia nonna Anna mi ha insegnato a custodire i ricordi di famiglia." }; } } });
const generatedInterview = museInterviewUpdates[museInterviewUpdates.length - 1]?.[0] || "";
if (allAnswersResponse.status !== 303 || allAnswersResponse.headers.get("location") !== "/libro/libro-muse#intervista-narrativa" || !generatedInterview.includes("Domanda 1:") || !generatedInterview.includes("Domanda 2:") || !generatedInterview.includes("custodire i ricordi di famiglia")) throw new Error("Muse: Affida queste risposte alla Musa non genera tutte le basi pertinenti dell'intervista");
let chapterGenerationCalls = 0;
const longMuseChapterDraft = `${groundedChapterMaterial} Le estati trascorse nella casa di mia nonna Anna, a Milano, sono il centro di questo ricordo. In quella casa imparavo a custodire la memoria della nostra famiglia. Ripensando a quel periodo, comprendo che la presenza di Anna ha dato continuità alle mie radici e ha reso quei ricordi parte del messaggio che desidero lasciare alla mia famiglia.`;
const chapterDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/capitolo/capitolo-muse/genera", {
  method: "POST",
  headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ title: "Il primo ricordo", content: "Un capitolo già iniziato." })
}), { ...env, DB: museDb, AI: { async run(_model, options) {
  chapterGenerationCalls += 1;
  if (chapterGenerationCalls === 1) return { response: "La casa di mia nonna Anna a Milano custodiva la memoria della famiglia. Il ricordo non trova ancora una forma. La casa di mia nonna Anna a Milano custodiva la memoria della famiglia." };
  return { response: longMuseChapterDraft };
} } });
const regeneratedChapter = [...museChapterUpdates].reverse().find(values => values[2] === "generato");
if (chapterDraftResponse.status !== 303 || chapterGenerationCalls !== 2 || !regeneratedChapter?.[1]?.includes("Le estati trascorse") || (regeneratedChapter?.[1]?.match(/custodiva la memoria/g) || []).length) throw new Error("Muse: il capitolo ripetitivo non viene scartato e rigenerato automaticamente");
const outlineResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-muse/struttura", { method: "POST", headers: { cookie: "spl_session=test" } }), { ...env, DB: museDb });
if (outlineResponse.status !== 303 || !museBatches.includes(14)) throw new Error("Muse: struttura da 12 capitoli non generata integralmente");
console.log("/libro/libro-muse: sezione Muse e selettore trilingue disponibili");

const activeTrialCreatedAt = new Date(Date.now() - 2 * 86400000).toISOString();
const trialUser = { id: "cliente-prova", email: "prova@example.com", nome: "Cliente Prova", createdAt: activeTrialCreatedAt };
const trialProject = { ...museProject, id: "libro-prova", userId: trialUser.id, title: "Il libro della prova", targetPages: 84, createdAt: trialUser.createdAt, plan: "free" };
const trialChapters = [
  { id: "capitolo-prova-1", projectId: trialProject.id, position: 1, title: "La prima soglia", content: "CONTENUTO VISIBILE DEL PRIMO CAPITOLO", status: "generato" },
  { id: "capitolo-prova-2", projectId: trialProject.id, position: 2, title: "La seconda soglia", content: "CONTENUTO RISERVATO DEL SECONDO CAPITOLO", status: "generato" }
];
let trialCommercialState = "prova_gratuita";
let trialUsage = 0;
const trialChapterUpdates = [];
const trialDb = {
  prepare(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes('UPDATE "BookChapter" SET title=?,content=?')) trialChapterUpdates.push(this.values);
        return { success: true };
      },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: ["projectId", "termsAcceptedAt", "privacyAcceptedAt", "specialDataConsentAt", "sourceMaterial", "usedAt", "deliveryStatus", "deliveryError", "deliveredAt", "messageId"].map(name => ({ name })) };
        if (sql.includes('FROM "BookChapter"')) return { results: trialChapters };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return trialUser;
        if (sql.includes('SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin"')) return trialProject;
        if (sql.includes('SELECT statoCommerciale FROM "BookProjectAdmin"')) return { statoCommerciale: trialCommercialState };
        if (sql.includes('FROM "BookChapter"')) return trialChapters.find(chapter => chapter.id === this.values[0]) || null;
        if (sql.includes('FROM "BookInterview"')) return null;
        if (sql.includes('FROM "AiUsage"')) return { requests: trialUsage };
        return null;
      }
    };
  },
  async batch(statements) { const results = []; for (const statement of statements) results.push(await statement.run()); return results; }
};
const trialEditorResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
const trialEditorHtml = await trialEditorResponse.text();
if (trialEditorResponse.status !== 200 || !trialEditorHtml.includes('id="chapter-card-capitolo-prova-1"') || !trialEditorHtml.includes("CONTENUTO VISIBILE DEL PRIMO CAPITOLO") || !trialEditorHtml.includes('id="chapter-lock-capitolo-prova-2"') || !trialEditorHtml.includes("La seconda soglia") || trialEditorHtml.includes("CONTENUTO RISERVATO DEL SECONDO CAPITOLO") || !trialEditorHtml.includes('data-total-chapters="2"')) throw new Error("Prova gratuita: il primo capitolo non è operativo o il secondo espone contenuti riservati");
if (!trialEditorHtml.includes("Percorso guidato") || !trialEditorHtml.includes("passi completati") || !trialEditorHtml.includes('href="/guida"')) throw new Error("Onboarding: lista dinamica o collegamento al manuale assenti dal libro");
const projectAutosaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/autosalva-progetto", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/json" }, body: JSON.stringify({ title: "Il libro della prova", tone: trialProject.tone, audience: trialProject.audience, targetPages: 84, sourceMaterial: trialProject.sourceMaterial, story: trialProject.story, people: trialProject.people, events: trialProject.events, message: trialProject.message, specialDataConsent: true }) }), { ...env, DB: trialDb });
const projectAutosaveResult = await projectAutosaveResponse.json();
if (projectAutosaveResponse.status !== 200 || !projectAutosaveResult.ok || !projectAutosaveResult.savedAt) throw new Error("Studio: autosalvataggio dei dati iniziali non operativo");
for (const required of ["Prova gratuita di 14 giorni", "Raoul Ragazzi Fisar", "IT05Z0538758590000049304579", "BPER Filiale Merano", "Pagato", "Gratuito"]) if (!trialEditorHtml.includes(required)) throw new Error(`Prova gratuita: informazione riservata mancante (${required})`);
let trialMuseCalls = 0;
const trialMuseSystems = [];
const trialMuseModels = [];
const trialChapterDraft = `Capitolo 1: La prima soglia\n\n${groundedChapterMaterial} Ogni estate tornavo nella casa di mia nonna Anna, a Milano. Quelle stanze accompagnavano la mia infanzia e davano forma al legame con la nostra famiglia. In quel tempo imparavo che custodire un ricordo significa conservarne il valore senza sottrarlo alla vita. Oggi ripenso a quelle estati come alla prima soglia della mia storia, perché da lì nasce il messaggio che desidero lasciare alla mia famiglia.`;
const trialFirstChapterResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run(model, options) { trialMuseCalls += 1; trialMuseModels.push(model); trialMuseSystems.push(options.messages?.[0]?.content || ""); return { response: trialChapterDraft }; } } });
const trialGeneratedChapter = [...trialChapterUpdates].reverse().find(values => values[2] === "generato");
const writerProfile = trialMuseSystems[0]?.toLocaleLowerCase("it-IT") || "";
const editorProfile = trialMuseSystems[1]?.toLocaleLowerCase("it-IT") || "";
if (trialFirstChapterResponse.status !== 303 || trialFirstChapterResponse.headers.get("location") !== "/libro/libro-prova#chapter-card-capitolo-prova-1" || trialMuseCalls !== 2 || !trialGeneratedChapter?.[1]?.includes("prima soglia della mia storia") || trialGeneratedChapter?.[1]?.startsWith("Capitolo 1") || trialGeneratedChapter?.[1]?.split(/\s+/).length < 1200) throw new Error("Prova gratuita: la Musa non genera un capitolo completo o lascia il titolo duplicato nel corpo");
if (trialMuseModels.some(model => model !== "@cf/meta/llama-3.3-70b-instruct-fp8-fast") || !writerProfile.includes("formazione universitaria") || !writerProfile.includes("grammaticalmente rigorosa") || !writerProfile.includes("sintatticamente compiuta") || !writerProfile.includes("fluida") || !writerProfile.includes("siamo usciti") || !writerProfile.includes("mai «abbiamo uscito»") || !writerProfile.includes("due riletture") || !writerProfile.includes("non imitare") || !editorProfile.includes("revisore letterario finale") || !editorProfile.includes("reggenze") || !editorProfile.includes("siamo andati")) throw new Error("Muse: profilo letterario, modello 70B o rilettura grammaticale finale non applicati al primo capitolo");
const richTrialSources = { sourceMaterial: trialProject.sourceMaterial, story: trialProject.story, people: trialProject.people, events: trialProject.events, message: trialProject.message };
Object.assign(trialProject,{sourceMaterial:"Nel 1987 vivevo in una casa sul lago.",story:"Ricordo quell’estate.",people:"Mia nonna.",events:"Una passeggiata.",message:"Custodire la memoria."});
let insufficientSourceAiCalls = 0;
const insufficientSourceResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { insufficientSourceAiCalls += 1; return { response: trialChapterDraft }; } } });
const insufficientSourceHtml = await insufficientSourceResponse.text();
if (insufficientSourceResponse.status !== 200 || insufficientSourceAiCalls !== 0 || !insufficientSourceHtml.includes("Per scrivere un capitolo completo senza inventare") || !insufficientSourceHtml.includes("Dammi altri dati e fatti") || !insufficientSourceHtml.includes("completa l’intervista")) throw new Error("Muse: tenta ancora di riempire un capitolo quando le fonti dell’autore sono insufficienti");
Object.assign(trialProject,richTrialSources);
const updatesBeforeShortDraft = trialChapterUpdates.length;
let shortDraftCalls = 0;
const shortGroundedDraft = groundedChapterMaterial.split(/\s+/).slice(0,350).join(" ");
const shortDraftResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { shortDraftCalls += 1; return { response: shortGroundedDraft }; } } });
const shortDraftHtml = await shortDraftResponse.text();
if (shortDraftResponse.status !== 200 || shortDraftCalls !== 2 || trialChapterUpdates.length !== updatesBeforeShortDraft || !shortDraftHtml.includes("La bozza è stata respinta perché troppo breve") || !shortDraftHtml.includes("Nessun testo è stato sostituito")) throw new Error("Muse: un capitolo molto più corto dell’obiettivo viene ancora salvato");
const updatesBeforeUnsupportedFact = trialChapterUpdates.length;
let unsupportedFactCalls = 0;
const unsupportedFactDraft = `${groundedChapterMaterial} Nel laboratorio di Venezia trovavo ogni mattina una vecchia macchina da scrivere.`;
const unsupportedFactResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { unsupportedFactCalls += 1; return { response: unsupportedFactDraft }; } } });
const unsupportedFactHtml = await unsupportedFactResponse.text();
if (unsupportedFactResponse.status !== 200 || unsupportedFactCalls !== 2 || trialChapterUpdates.length !== updatesBeforeUnsupportedFact || !unsupportedFactHtml.includes("non pienamente verificabile sulle fonti")) throw new Error("Muse: un luogo o fatto concreto assente dalle fonti supera ancora il controllo finale");
let auxiliaryGuardCalls = 0;
const wrongAuxiliaryDraft = `${groundedChapterMaterial} Ogni estate abbiamo uscito dalla casa di mia nonna Anna, a Milano. Quelle giornate accompagnavano la mia infanzia e davano forma al legame con la nostra famiglia. In quel tempo imparavo che custodire un ricordo significa conservarne il valore senza sottrarlo alla vita. Oggi ripenso a quelle estati come alla prima soglia della mia storia, perché da lì nasce il messaggio che desidero lasciare alla mia famiglia.`;
const correctedAuxiliaryDraft = `${groundedChapterMaterial} Ogni estate siamo usciti dalla casa di mia nonna Anna, a Milano. Quelle giornate accompagnavano la mia infanzia e davano forma al legame con la nostra famiglia. In quel tempo imparavo che custodire un ricordo significa conservarne il valore senza sottrarlo alla vita. Oggi ripenso a quelle estati come alla prima soglia della mia storia, perché da lì nasce il messaggio che desidero lasciare alla mia famiglia.`;
const auxiliaryGuardResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { auxiliaryGuardCalls += 1; return { response: auxiliaryGuardCalls === 1 ? wrongAuxiliaryDraft : correctedAuxiliaryDraft }; } } });
const grammarCheckedChapter = [...trialChapterUpdates].reverse().find(values => values[2] === "generato");
if (auxiliaryGuardResponse.status !== 303 || auxiliaryGuardCalls !== 2 || !grammarCheckedChapter?.[1]?.includes("siamo usciti") || grammarCheckedChapter?.[1]?.includes("abbiamo uscito")) throw new Error("Muse: un errore grave nell'uso dell'ausiliare non viene respinto e corretto prima del salvataggio");
const wrongAuxiliarySource = "Nel 1987 abbiamo uscito dalla casa sul lago e abbiamo andato al pontile con nonno Carlo. Il giorno seguente abbiamo ritornato insieme e abbiamo rimasto in silenzio davanti alla vecchia barca.";
const correctedAuxiliarySource = "Nel 1987 siamo usciti dalla casa sul lago e siamo andati al pontile con nonno Carlo. Il giorno seguente siamo ritornati insieme e siamo rimasti in silenzio davanti alla vecchia barca.";
const grammarRevisionResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/rifinisci", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: wrongAuxiliarySource, action: "grammar" }) }), { ...env, DB: trialDb, AI: { async run() { return { response: correctedAuxiliarySource }; } } });
const appliedGrammarRevision = [...trialChapterUpdates].reverse().find(values => values[2] === "revisionato_grammar");
if (grammarRevisionResponse.status !== 303 || !appliedGrammarRevision?.[1]?.includes("siamo usciti") || !appliedGrammarRevision?.[1]?.includes("siamo andati") || !appliedGrammarRevision?.[1]?.includes("siamo rimasti") || appliedGrammarRevision?.[1]?.includes("abbiamo uscito")) throw new Error("Correggi grammatica: le correzioni multiple degli ausiliari vengono respinte dal controllo di fedeltà");
trialChapters[0].status = "revisione_non_applicata";
const rejectedRevisionNoticeResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
const rejectedRevisionNoticeHtml = await rejectedRevisionNoticeResponse.text();
if (!rejectedRevisionNoticeHtml.includes("La revisione non è stata applicata") || !rejectedRevisionNoticeHtml.includes("Il testo originale è rimasto intatto")) throw new Error("Correggi grammatica: il rifiuto di una revisione resta silenzioso");
trialChapters[0].status = "generato";
const blockedSaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-2/salva", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "Titolo forzato", content: "Testo forzato" }) }), { ...env, DB: trialDb });
const blockedSaveHtml = await blockedSaveResponse.text();
const blockedCardHtml = blockedSaveHtml.match(/<article class="card chapter-lock-card" id="chapter-lock-capitolo-prova-2">([\s\S]*?)<\/article>/)?.[1] || "";
if (blockedSaveResponse.status !== 200 || !blockedCardHtml.includes("Questo capitolo è riservato al libro completo") || !blockedCardHtml.includes("data-chapter-notice") || trialChapterUpdates.some(values => values.includes("Testo forzato"))) throw new Error("Prova gratuita: salvataggio diretto del secondo capitolo non bloccato o messaggio non mostrato nel capitolo");
const blockedAutosaveResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-2/autosalva", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/json" }, body: JSON.stringify({ title: "Titolo forzato", content: "Testo forzato" }) }), { ...env, DB: trialDb });
if (blockedAutosaveResponse.status !== 403 || !(await blockedAutosaveResponse.json()).error?.includes("Capitolo bloccato")) throw new Error("Prova gratuita: autosalvataggio diretto del secondo capitolo non bloccato");
let blockedAiCalls = 0;
const blockedAi = { async run() { blockedAiCalls += 1; return { response: "Non deve essere usato" }; } };
const blockedGenerateResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-2/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La seconda soglia", content: "" }) }), { ...env, DB: trialDb, AI: blockedAi });
const blockedRefineResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-2/rifinisci", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La seconda soglia", content: "Testo", action: "improve" }) }), { ...env, DB: trialDb, AI: blockedAi });
if (blockedGenerateResponse.status !== 200 || blockedRefineResponse.status !== 200 || blockedAiCalls !== 0) throw new Error("Prova gratuita: Musa o Migliora aggirano il blocco del secondo capitolo");
const trialPreviewResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/anteprima", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
const trialPreviewHtml = await trialPreviewResponse.text();
if (trialPreviewResponse.status !== 200 || !trialPreviewHtml.includes("CONTENUTO VISIBILE DEL PRIMO CAPITOLO") || trialPreviewHtml.includes("CONTENUTO RISERVATO DEL SECONDO CAPITOLO") || trialPreviewHtml.includes("La seconda soglia")) throw new Error("Prova gratuita: il PDF cliente include capitoli bloccati");
trialProject.createdAt = new Date(Date.now() - 16 * 86400000).toISOString();
const expiredTrialResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
const expiredTrialHtml = await expiredTrialResponse.text();
if (expiredTrialResponse.status !== 200 || !expiredTrialHtml.includes("Prova gratuita conclusa") || !expiredTrialHtml.includes('id="chapter-lock-capitolo-prova-1"') || !expiredTrialHtml.includes('id="chapter-lock-capitolo-prova-2"') || expiredTrialHtml.includes("CONTENUTO VISIBILE DEL PRIMO CAPITOLO") || expiredTrialHtml.includes("CONTENUTO RISERVATO DEL SECONDO CAPITOLO")) throw new Error("Prova gratuita: la scadenza di 14 giorni non blocca integralmente il progetto");
let expiredTrialAiCalls = 0;
const expiredTrialGeneration = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { expiredTrialAiCalls += 1; return { response: trialChapterDraft }; } } });
if (expiredTrialGeneration.status !== 200 || expiredTrialAiCalls !== 0) throw new Error("Prova gratuita: una chiamata diretta usa ancora la Musa dopo la scadenza");
const expiredTrialPreview = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/anteprima", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
const expiredTrialPreviewHtml = await expiredTrialPreview.text();
if (expiredTrialPreview.status !== 200 || expiredTrialPreviewHtml.includes("CONTENUTO VISIBILE DEL PRIMO CAPITOLO") || expiredTrialPreviewHtml.includes("CONTENUTO RISERVATO DEL SECONDO CAPITOLO")) throw new Error("Prova gratuita: l’anteprima espone ancora i capitoli dopo la scadenza");
trialProject.createdAt = activeTrialCreatedAt;
trialUsage = 3;
let exhaustedTrialAiCalls = 0;
const exhaustedTrialGeneration = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova/capitolo/capitolo-prova-1/genera", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "La prima soglia", content: "" }) }), { ...env, DB: trialDb, AI: { async run() { exhaustedTrialAiCalls += 1; return { response: trialChapterDraft }; } } });
const exhaustedTrialHtml = await exhaustedTrialGeneration.text();
if (exhaustedTrialGeneration.status !== 200 || exhaustedTrialAiCalls !== 0 || !exhaustedTrialHtml.includes("tre generazioni gratuite disponibili per l’account")) throw new Error("Prova gratuita: il limite complessivo di generazioni IA non viene applicato");
trialUsage = 0;
for (const unlockedState of ["pagato", "gratuito"]) {
  trialCommercialState = unlockedState;
  const unlockedResponse = await worker.fetch(new Request("https://www.splendoria.vip/libro/libro-prova", { headers: { cookie: "spl_session=test" } }), { ...env, DB: trialDb });
  const unlockedHtml = await unlockedResponse.text();
  if (unlockedResponse.status !== 200 || !unlockedHtml.includes('id="chapter-card-capitolo-prova-2"') || !unlockedHtml.includes("CONTENUTO RISERVATO DEL SECONDO CAPITOLO") || unlockedHtml.includes('id="chapter-lock-capitolo-prova-2"')) throw new Error(`Sblocco amministrativo: stato ${unlockedState} non apre tutti i capitoli`);
}
trialCommercialState = "prova_gratuita";
let newBookBatch = [];
let existingProjectCount = 0;
const newBookDb = {
  prepare(sql) { return { sql, values: [], bind(...values) { this.values = values; return this; }, async run() { return { success: true }; }, async all() { return { results: [] }; }, async first() { if (sql.includes('FROM "Session" s JOIN "User" u')) return trialUser; if (sql.includes('SELECT COUNT(*) total FROM "BookProject"')) return { total: existingProjectCount }; return null; } }; },
  async batch(statements) { newBookBatch = statements; return statements.map(() => ({ success: true })); }
};
const newBookResponse = await worker.fetch(new Request("https://www.splendoria.vip/nuovo-libro", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "Il mio primo libro", genre: "Autobiografia", targetPages: "84" }) }), { ...env, DB: newBookDb });
if (newBookResponse.status !== 303 || newBookBatch.length !== 2 || !newBookBatch[1].sql.includes('INSERT INTO "BookProjectAdmin"') || newBookBatch[1].values[3] !== "prova_gratuita") throw new Error("Nuovo libro: progetto e stato di prova gratuita non vengono creati atomicamente");
existingProjectCount = 1;
const secondBookResponse = await worker.fetch(new Request("https://www.splendoria.vip/nuovo-libro", { method: "POST", headers: { cookie: "spl_session=test", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ title: "Il mio secondo libro", genre: "Memoriale", targetPages: "84" }) }), { ...env, DB: newBookDb });
if (secondBookResponse.status !== 303 || newBookBatch[1].values[3] !== "formula_scelta") throw new Error("Nuovo libro: lo stesso account può ancora creare più prove gratuite");
console.log("/prova-gratuita: 14 giorni, quota totale, progetto unico, PDF e sblocco verificati");

const previewUser = { id: "admin-pdf", email: "raoulragazzi@gmail.com", nome: "Raoul" };
const previewProject = { id: "libro-pdf", userId: "cliente-pdf", title: "La mia vita", authorName: "Ulli" };
const previewChapters = [
  { id: "cap-1", projectId: "libro-pdf", position: 1, title: "La mia infanzia", content: "Questo è il primo capoverso del libro.\n\nQuesto è il secondo capoverso, pronto per la stampa." },
  { id: "cap-2", projectId: "libro-pdf", position: 2, title: "La mia famiglia", content: "Un altro capitolo della storia." }
];
const previewDb = {
  prepare(sql) {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
        if (sql.includes('FROM "BookChapter"')) return { results: previewChapters };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('u.nome authorName')) return previewProject;
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const previewResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/progetto/libro-pdf/anteprima", { headers: { cookie: "spl_session=test" } }), { ...env, DB: previewDb });
const previewHtml = await previewResponse.text();
const printRequirements = ["data-print-book", "Formato finale A5 verticale", "148 × 210 mm", "154 × 216 mm", "size:154mm 216mm", "margin-top:18mm", "margin-bottom:18mm", "margin-left:8mm", "margin-right:18mm", "3 mm di abbondanza", "senza crocini", "eb-garamond-400.woff2", "font-size:14pt", "line-height:15.68pt", "font-size:20pt", "font-size:11pt", "text-align:justify", "text-indent:12.5mm", "La mia infanzia"];
if (previewResponse.status !== 200 || printRequirements.some(text => !previewHtml.includes(text)) || previewHtml.includes("book-crop-marks") || previewHtml.includes("@top-left-corner")) throw new Error("PDF: impaginazione A5 verticale conforme al template incompleta");
const titlePageHtml = previewHtml.match(/<section class="book-title-page">([\s\S]*?)<\/section>/)?.[1] || "";
if (!titlePageHtml || /Splendoria/i.test(titlePageHtml) || titlePageHtml.includes("book-imprint\"")) throw new Error("PDF: la scritta Splendoria è ancora presente nella prima pagina");
if (previewHtml.includes('onclick="window.print()"')) throw new Error("PDF: gestore inline incompatibile con la CSP ancora presente");
if (!previewHtml.includes("Controllo umano dei contenuti") || !previewHtml.includes("diritti d’autore") || !previewHtml.includes("non sostituisce una valutazione legale")) throw new Error("Admin: checklist riservata di controllo contenuti mancante");
console.log("/anteprima: stampa PDF A5 verticale, 148 × 210 mm al taglio e abbondanza di 3 mm, disponibile");

const legacyPreviewDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [] };
        if (sql.includes('FROM "Capitolo" WHERE userId=')) return { results: [
          { titolo: "Capitolo 1: La mia infanzia", testo: "Il contenuto storico del primo capitolo.", genere: "Autobiografia", createdAt: "2026-01-01", updatedAt: "2026-01-02" },
          { titolo: "Capitolo 2 - La famiglia", testo: "Il contenuto storico del secondo capitolo.", genere: "Autobiografia", createdAt: "2026-01-03", updatedAt: "2026-01-04" }
        ] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT id,nome,email FROM "User"')) return { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com" };
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const legacyPreviewResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico/anteprima-storica", { headers: { cookie: "spl_session=test" } }), { ...env, DB: legacyPreviewDb });
const legacyPreviewHtml = await legacyPreviewResponse.text();
if (legacyPreviewResponse.status !== 200 || !legacyPreviewHtml.includes("La mia Vita") || !legacyPreviewHtml.includes("La mia infanzia") || !legacyPreviewHtml.includes("Il contenuto storico del secondo capitolo") || legacyPreviewHtml.includes("Capitolo 1: La mia infanzia</h2>")) throw new Error("Admin: anteprima PDF dei capitoli storici non valida");
console.log("/admin/cliente: anteprima PDF dei contenuti storici disponibile");

const dashboardDb = {
  prepare(sql) {
    return {
      bind() { return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: [] };
        if (sql.includes('SELECT p.id,p.title,p.genre')) return { results: [{ id: "libro-dashboard", title: "Una storia", genre: "Memoriale", status: "bozza", plan: "free", updatedAt: "2026-08-05", nome: "Maria", email: "maria@example.com", chapters: 4, completed: 2, statoEditoriale: "in_lavorazione", statoCommerciale: "gratuito" }] };
        if (sql.includes('SELECT u.id userId,u.nome,u.email,COUNT(c.id)')) return { results: [{ userId: "cliente-storico", nome: "Ulli", email: "ulli@example.com", chapters: 14, completed: 14, updatedAt: "2026-08-04", genre: "Autobiografia", statoEditoriale: "bozza", statoCommerciale: "gratuito" }] };
        if (sql.includes('SELECT u.id,u.nome,u.email,u.createdAt')) return { results: [
          { id: "cliente-dashboard", nome: "Maria", email: "maria@example.com", createdAt: "2026-08-01", books: 1, orders: 0, legacyChapters: 0, latestProjectId: "libro-dashboard", latestStatus: "bozza", chapters: 4, completedChapters: 2 },
          { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com", createdAt: "2026-07-01", books: 0, orders: 1, legacyChapters: 14, legacyCompletedChapters: 7, latestProjectId: null, latestStatus: null, chapters: 0, completedChapters: 0 }
        ] };
        if (sql.includes('FROM "AuditEvent"')) return { results: [{ action: "admin.project_state_changed", actorRole: "admin", targetType: "project", outcome: "success", metadata: JSON.stringify({ editorialState: "approvato", commercialState: "pagato" }), createdAt: "2026-08-12T10:00:00.000Z" }] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT (SELECT COUNT(*) FROM "User"')) return { users: 2, books: 2, completed: 0, orders: 1 };
        return null;
      }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const dashboardResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin", { headers: { cookie: "spl_session=test" } }), { ...env, DB: dashboardDb });
const dashboardHtml = await dashboardResponse.text();
if (dashboardResponse.status !== 200 || !dashboardHtml.includes("Maria") || !dashboardHtml.includes("50% · 2/4 capitoli") || !dashboardHtml.includes("50% · 7/14") || !dashboardHtml.includes('/admin/progetto/libro-dashboard/anteprima') || !dashboardHtml.includes('/admin/cliente/cliente-storico/anteprima-storica') || !dashboardHtml.includes('/admin/cliente/cliente-storico') || (dashboardHtml.match(/Vedi PDF/g) || []).length < 4 || (dashboardHtml.match(/Gestisci e sblocca/g) || []).length < 4 || !dashboardHtml.includes("Registro attività critiche") || !dashboardHtml.includes("Stato progetto aggiornato") || !dashboardHtml.includes("stato commerciale: pagato") || !dashboardHtml.includes("365 giorni")) throw new Error("Admin: utenti, avanzamento, PDF, controlli di sblocco o audit non visibili");
console.log("/admin: utenti, avanzamento, PDF e controlli di sblocco visibili");

const legacyManagementState = { projectAdmin: null, orderStatus: null };
const legacyManagementDb = {
  prepare(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() { return { success: true }; },
      async all() {
        if (sql.startsWith("PRAGMA table_info")) return { results: ["projectId", "termsAcceptedAt", "privacyAcceptedAt", "specialDataConsentAt", "usedAt", "deliveryStatus", "deliveryError", "deliveredAt", "messageId"].map(name => ({ name })) };
        if (sql.includes('SELECT titolo,genere,length(testo)')) return { results: [
          { titolo: "Capitolo 1: Le radici", genere: "Autobiografia", chars: 1200, updatedAt: "2026-08-01" },
          { titolo: "Capitolo 2: La svolta", genere: "Autobiografia", chars: 1800, updatedAt: "2026-08-02" }
        ] };
        if (sql.includes('SELECT * FROM "Ordine" WHERE userId=')) return { results: [{ formula: "digital", prezzo: 1000, stato: legacyManagementState.orderStatus || "da_pagare" }] };
        return { results: [] };
      },
      async first() {
        if (sql.includes('FROM "Session" s JOIN "User" u')) return previewUser;
        if (sql.includes('SELECT u.id,u.nome,u.email,a.statoEditoriale')) return { id: "cliente-storico", nome: "Ulli", email: "ulli@example.com", statoEditoriale: "in_lavorazione", statoCommerciale: legacyManagementState.projectAdmin?.[2] || "gratuito", tutor: "", note: "" };
        if (sql.includes('SELECT id FROM "User" WHERE id=')) return { id: "cliente-storico" };
        if (sql.includes('SELECT id FROM "Capitolo" WHERE userId=')) return { id: "capitolo-storico" };
        return null;
      }
    };
  },
  async batch(statements) {
    for (const statement of statements) {
      if (statement.sql.startsWith('INSERT INTO "ProjectAdmin"')) legacyManagementState.projectAdmin = statement.values;
      if (statement.sql.startsWith('UPDATE "Ordine" SET stato=')) legacyManagementState.orderStatus = statement.values[0];
    }
    return statements.map(() => ({ success: true }));
  }
};
const legacyManagementResponse = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico", { headers: { cookie: "spl_session=test" } }), { ...env, DB: legacyManagementDb });
const legacyManagementHtml = await legacyManagementResponse.text();
if (legacyManagementResponse.status !== 200 || !legacyManagementHtml.includes("Gestione interna e sblocco") || !legacyManagementHtml.includes('value="prova_gratuita"') || !legacyManagementHtml.includes('value="gratuito"') || !legacyManagementHtml.includes('value="pagato"') || !legacyManagementHtml.includes('value="rimborsato"')) throw new Error("Admin: gestione commerciale del libro storico non disponibile");
const legacyManagementPost = await worker.fetch(new Request("https://www.splendoria.vip/admin/cliente/cliente-storico", { method: "POST", headers: { cookie: "spl_session=test" }, body: new URLSearchParams({ statoEditoriale: "approvato", statoCommerciale: "pagato", tutor: "Tutor", note: "Pagamento verificato" }) }), { ...env, DB: legacyManagementDb });
const legacyManagementPostHtml = await legacyManagementPost.text();
if (legacyManagementPost.status !== 200 || !legacyManagementPostHtml.includes("Stato del libro storico aggiornato") || legacyManagementState.projectAdmin?.[1] !== "approvato" || legacyManagementState.projectAdmin?.[2] !== "pagato" || legacyManagementState.orderStatus !== "pagato") throw new Error("Admin: salvataggio o sblocco del libro storico non riuscito");
console.log("/admin/cliente: stati gratuito, da pagare, pagato e rimborsato ripristinati");

let contactValues = null;
let contactDelivery = null;
const contactDb = {
  prepare(sql) {
    return {
      bind(...values) {
        if (sql.includes('INSERT INTO "ContactMessage"')) contactValues = values;
        if (sql.includes('UPDATE "ContactMessage" SET deliveryStatus=')) contactDelivery = values;
        return this;
      },
      async run() { return { success: true }; },
      async first() { return null; },
      async all() { return { results: [] }; }
    };
  },
  async batch(statements) { return statements.map(() => ({ success: true })); }
};
const contactBody = new URLSearchParams({ fullName: "Mario Rossi", phone: "+39 000 000000", email: "mario@example.com", plan: "assisted", subject: "Vorrei informazioni", message: "Contattatemi, grazie.", privacyRead: "yes" });
let contactEmail = null;
const contactResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: contactBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send(message) { contactEmail = message; return { messageId: "contact-message-id" }; } } });
if (contactResponse.status !== 303 || contactResponse.headers.get("location") !== "/?contatto=inviato#contatti" || !contactValues?.[4]?.includes("Splendoria Signature") || !contactValues?.[5]?.startsWith("Formula scelta: Splendoria Signature")) throw new Error("Contatti: formula selezionata non registrata");
if (contactEmail?.to !== "raoulragazzi@gmail.com" || !contactEmail?.text?.includes("mario@example.com") || contactDelivery?.[0] !== "sent") throw new Error("Contatti: email non inoltrata all’amministratore");

contactValues = null;
contactDelivery = null;
const assessmentBody = new URLSearchParams({ assessment: "editorial", fullName: "Anna Bianchi", phone: "+39 111 111111", email: "anna@example.com", plan: "complete", legacyScope: "Una storia generazionale", turningOrigins: "yes", turningRelationships: "yes", turningVision: "yes", memoryKeywords: "cascina, fotografie, domenica", governance: "Livello 3 · Supervisione umana", privacyRead: "yes" });
const assessmentResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: assessmentBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send(message) { contactEmail = message; return { messageId: "assessment-message-id" }; } } });
if (assessmentResponse.headers.get("location") !== "/?contatto=inviato#contatti" || !contactValues?.[4]?.includes("Assessment editoriale Splendoria") || !contactValues?.[5]?.includes("Una storia generazionale") || !contactValues?.[5]?.includes("cascina, fotografie, domenica") || !contactEmail?.text?.includes("Livello 3 · Supervisione umana")) throw new Error("Assessment: fallback senza JavaScript non genera o non inoltra la Scheda Tecnica");

contactDelivery = null;
const failedContactResponse = await worker.fetch(new Request("https://www.splendoria.vip/contatti", { method: "POST", body: contactBody }), { ...env, DB: contactDb, CONTACT_EMAIL: { async send() { const error = new Error("Destinazione non disponibile"); error.code = "E_DESTINATION"; throw error; } } });
if (failedContactResponse.headers.get("location") !== "/?contatto=errore#contatti" || contactDelivery?.[0] !== "failed" || !contactDelivery?.[1]?.includes("E_DESTINATION")) throw new Error("Contatti: errore di consegna non gestito");

let forwardedTo = null;
await worker.email({ async forward(destination) { forwardedTo = destination; } }, env);
if (forwardedTo !== "raoulragazzi@gmail.com") throw new Error("Posta in entrata: inoltro a Gmail non configurato");
console.log("/contatti: modulo e posta in entrata inoltrati a Gmail");

function authDb(user) {
  return {
    prepare(sql) {
      const statement = {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() { return { success: true }; },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM "Session" s JOIN "User" u')) return user;
          // Nessun progetto viene restituito: simula il tentativo di aprire
          // un libro appartenente a un altro cliente.
          return null;
        }
      };
      return statement;
    },
    async batch(statements) { return statements.map(() => ({ success: true })); }
  };
}

async function expectRedirect(path, user, expected) {
  const response = await worker.fetch(new Request(`https://www.splendoria.vip${path}`, { headers: { cookie: "spl_session=test" } }), { ...env, DB: authDb(user) });
  if (response.status !== 303 || response.headers.get("location") !== expected) throw new Error(`${path}: atteso redirect ${expected}, ricevuto ${response.status} ${response.headers.get("location")}`);
  console.log(`${path}: accesso separato correttamente`);
}

await expectRedirect("/admin", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/area-amministratore");
await expectRedirect("/libro/progetto-di-un-altro", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/studio");
await expectRedirect("/admin/progetto/progetto-1/anteprima", { id: "cliente-1", email: "cliente@example.com", nome: "Cliente" }, "/area-amministratore");
await expectRedirect("/studio", { id: "admin-1", email: "raoulragazzi@gmail.com", nome: "Admin" }, "/admin");

function credentialDb(user) {
  const state = { migratedHash: "", adminChallenges: new Map(), sessionCreated: false };
  const db = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() {
          let changes = 1;
          if (sql.startsWith('UPDATE "User" SET passwordHash=')) state.migratedHash = this.values[0];
          if (sql.startsWith('INSERT INTO "AdminLoginChallenge"')) {
            const [id, userId, codeHash, expiresAt, attempts, createdAt] = this.values;
            state.adminChallenges.set(id, { id, userId, codeHash, expiresAt, attempts, createdAt, email: user.email, usedAt: null });
          }
          if (sql.startsWith('DELETE FROM "AdminLoginChallenge" WHERE id=')) state.adminChallenges.delete(this.values[0]);
          if (sql.startsWith('UPDATE "AdminLoginChallenge" SET attempts=')) {
            const challenge = state.adminChallenges.get(this.values[0]);
            if (challenge) challenge.attempts += 1;
          }
          if (sql.startsWith('UPDATE "AdminLoginChallenge" SET usedAt=')) {
            const challenge = state.adminChallenges.get(this.values[1]);
            if (challenge && !challenge.usedAt) challenge.usedAt = this.values[0];
            else changes = 0;
          }
          if (sql.startsWith('INSERT INTO "Session"')) state.sessionCreated = true;
          return { success: true, meta: { changes } };
        },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }, { name: "termsAcceptedAt" }, { name: "privacyAcceptedAt" }, { name: "specialDataConsentAt" }, { name: "deliveryStatus" }, { name: "deliveryError" }, { name: "deliveredAt" }, { name: "messageId" }] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('SELECT * FROM "User" WHERE lower(trim(email))=')) return user;
          if (sql.includes('FROM "AdminLoginChallenge" c JOIN "User"')) return state.adminChallenges.get(this.values[0]) || null;
          return null;
        }
      };
    },
    async batch(statements) { const results = []; for (const statement of statements) results.push(await statement.run()); return results; }
  };
  return { db, state };
}

const legacyPassword = "PasswordCorretta1!";
const clientCredentials = credentialDb({ id: "legacy-client", email: "ulli@apple.bz", nome: "Ulli", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const clientLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz", password: legacyPassword }) }), { ...env, DB: clientCredentials.db });
if (clientLogin.status !== 303 || clientLogin.headers.get("location") !== "/studio" || !clientLogin.headers.get("set-cookie")?.includes("spl_session=")) throw new Error("Login: account cliente storico non accettato");
if (!clientCredentials.state.migratedHash.startsWith("pbkdf2$")) throw new Error("Login: hash storico non migrato");

const shortLegacyPassword = "Breve7!";
const portableBcryptHash = (await bcrypt.hash(shortLegacyPassword, 4)).replace(/^\$2[ab]\$/, "$2y$");
const portableCredentials = credentialDb({ id: "portable-client", email: " ULLI@APPLE.BZ ", nome: "Ulli", passwordHash: portableBcryptHash });
const portableLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz", password: shortLegacyPassword }) }), { ...env, DB: portableCredentials.db });
if (portableLogin.status !== 303 || portableLogin.headers.get("location") !== "/studio") throw new Error("Login: email storica o variante bcrypt non accettata");

const adminCredentials = credentialDb({ id: "legacy-admin", email: env.ADMIN_EMAIL, nome: "Raoul", passwordHash: await bcrypt.hash(legacyPassword, 4) });
let adminSecurityEmail = null;
const adminLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: env.ADMIN_EMAIL, password: legacyPassword }) }), { ...env, DB: adminCredentials.db, CONTACT_EMAIL: { async send(message) { adminSecurityEmail = message; return { messageId: "admin-security-code" }; } } });
const adminChallengeId = adminLogin.headers.get("location")?.match(/challenge=([^&]+)/)?.[1];
const adminSecurityCode = adminSecurityEmail?.text?.match(/\b(\d{6})\b/)?.[1];
if (adminLogin.status !== 303 || !adminLogin.headers.get("location")?.startsWith("/verifica-amministratore?challenge=") || !adminChallengeId || !adminSecurityCode || adminLogin.headers.get("set-cookie") || adminCredentials.state.sessionCreated) throw new Error("Login amministratore: password non seguita dalla seconda verifica email");
const adminCodePage = await worker.fetch(new Request(`https://www.splendoria.vip/verifica-amministratore?challenge=${adminChallengeId}`), { ...env, DB: adminCredentials.db });
if (adminCodePage.status !== 200 || !(await adminCodePage.text()).includes("codice di sei cifre")) throw new Error("Login amministratore: pagina di verifica non disponibile");
const invalidAdminCode = adminSecurityCode === "000000" ? "111111" : "000000";
const wrongAdminCode = await worker.fetch(new Request("https://www.splendoria.vip/verifica-amministratore", { method: "POST", body: new URLSearchParams({ challenge: adminChallengeId, code: invalidAdminCode }) }), { ...env, DB: adminCredentials.db });
if (wrongAdminCode.status !== 200 || !(await wrongAdminCode.text()).includes("Codice non corretto")) throw new Error("Login amministratore: codice errato non rifiutato");
const verifiedAdminLogin = await worker.fetch(new Request("https://www.splendoria.vip/verifica-amministratore", { method: "POST", body: new URLSearchParams({ challenge: adminChallengeId, code: adminSecurityCode }) }), { ...env, DB: adminCredentials.db });
if (verifiedAdminLogin.status !== 303 || verifiedAdminLogin.headers.get("location") !== "/admin" || !verifiedAdminLogin.headers.get("set-cookie")?.includes("spl_session=") || !adminCredentials.state.sessionCreated) throw new Error("Login amministratore: codice corretto non crea la sessione protetta");
const reusedAdminCode = await worker.fetch(new Request("https://www.splendoria.vip/verifica-amministratore", { method: "POST", body: new URLSearchParams({ challenge: adminChallengeId, code: adminSecurityCode }) }), { ...env, DB: adminCredentials.db });
if (reusedAdminCode.status !== 200 || !(await reusedAdminCode.text()).includes("non è più valido")) throw new Error("Login amministratore: il codice monouso può essere riutilizzato");

const wrongAreaCredentials = credentialDb({ id: "client-role", email: "cliente@example.com", nome: "Cliente", passwordHash: await bcrypt.hash(legacyPassword, 4) });
const wrongAreaLogin = await worker.fetch(new Request("https://www.splendoria.vip/area-amministratore", { method: "POST", body: new URLSearchParams({ email: "cliente@example.com", password: legacyPassword }) }), { ...env, DB: wrongAreaCredentials.db });
const wrongAreaHtml = await wrongAreaLogin.text();
if (wrongAreaLogin.status !== 200 || !wrongAreaHtml.includes("non è autorizzato")) throw new Error("Login: separazione dei ruoli non applicata");
console.log("/login: account storici, ruoli separati e secondo fattore amministratore verificati");

function registrationDb() {
  const state = { usersByEmail: new Map(), usersById: new Map(), sessions: new Map(), notifications: new Map(), emailVerifications: new Map(), auditEvents: [], insertedUsers: 0, registrationBatchSize: 0, passwordHash: "", accountDeleted: false, deletedSql: [] };
  const db = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async run() {
          if (sql.startsWith('INSERT INTO "User"')) {
            const [id, email, passwordHash, nome, privacyAcceptedAt, createdAt] = this.values;
            const user = { id, email, passwordHash, nome, privacyAcceptedAt, createdAt, emailVerifiedAt: null };
            state.usersByEmail.set(email, user);
            state.usersById.set(id, user);
            state.insertedUsers += 1;
            state.passwordHash = passwordHash;
          }
          if (sql.startsWith('INSERT INTO "Session"')) {
            const [id, userId, tokenHash, expiresAt, createdAt] = this.values;
            state.sessions.set(tokenHash, { id, userId, tokenHash, expiresAt, createdAt });
          }
          if (sql.startsWith('INSERT INTO "RegistrationNotification"')) {
            const [id, userId, nome, email, deliveryStatus, deliveryError, attempts, lastAttemptAt, acceptedAt, messageId, createdAt] = this.values;
            state.notifications.set(id, { id, userId, nome, email, deliveryStatus, deliveryError, attempts, lastAttemptAt: lastAttemptAt || "", acceptedAt, messageId, createdAt });
          }
          if (sql.startsWith('INSERT INTO "EmailVerification"')) {
            const [id, userId, tokenHash, expiresAt, deliveryStatus, deliveryError, createdAt] = this.values;
            state.emailVerifications.set(id, { id, userId, tokenHash, expiresAt, deliveryStatus, deliveryError, createdAt, usedAt: null, deliveredAt: null, messageId: "" });
          }
          if (sql.startsWith('INSERT INTO "AuditEvent"')) state.auditEvents.push({ action: this.values[3], actorHash: this.values[1], targetHash: this.values[5], outcome: this.values[6], metadata: this.values[7] });
          if (sql.startsWith('UPDATE "EmailVerification" SET deliveryStatus=?,deliveryError=?,deliveredAt=')) {
            const verification = state.emailVerifications.get(this.values[4]);
            if (verification) Object.assign(verification, { deliveryStatus: this.values[0], deliveryError: this.values[1], deliveredAt: this.values[2], messageId: this.values[3] });
          }
          if (sql.startsWith('UPDATE "EmailVerification" SET deliveryStatus=?,deliveryError=? WHERE id=')) {
            const verification = state.emailVerifications.get(this.values[2]);
            if (verification) Object.assign(verification, { deliveryStatus: this.values[0], deliveryError: this.values[1] });
          }
          if (sql.startsWith('UPDATE "EmailVerification" SET usedAt=')) {
            const verification = state.emailVerifications.get(this.values[1]);
            if (!verification || verification.usedAt) return { success: true, meta: { changes: 0 } };
            verification.usedAt = this.values[0];
          }
          if (sql.startsWith('UPDATE "User" SET emailVerifiedAt=')) {
            const account = state.usersById.get(this.values[1]);
            if (account && !account.emailVerifiedAt) account.emailVerifiedAt = this.values[0];
          }
          if (sql.startsWith('UPDATE "User" SET nome=? WHERE id=')) {
            const account = state.usersById.get(this.values[1]);
            if (account) account.nome = this.values[0];
          }
          if (sql.startsWith('UPDATE "User" SET email=?,emailVerifiedAt=NULL')) {
            const account = state.usersById.get(this.values[1]);
            if (account) {
              state.usersByEmail.delete(account.email);
              account.email = this.values[0];
              account.emailVerifiedAt = null;
              state.usersByEmail.set(account.email, account);
            }
          }
          if (sql.startsWith('UPDATE "User" SET email=?,passwordHash=?,nome=?')) {
            const account = state.usersById.get(this.values[3]);
            if (account) {
              state.usersByEmail.delete(account.email);
              Object.assign(account, { email: this.values[0], passwordHash: this.values[1], nome: this.values[2], privacyAcceptedAt: null, emailVerifiedAt: null });
              state.usersByEmail.set(account.email, account);
              state.accountDeleted = true;
            }
          }
          if (sql.startsWith(`UPDATE "RegistrationNotification" SET deliveryStatus='sending'`)) {
            const notification = state.notifications.get(this.values[1]);
            if (notification) Object.assign(notification, { deliveryStatus: "sending", attempts: Number(notification.attempts || 0) + 1, lastAttemptAt: this.values[0] });
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET deliveryStatus=?,deliveryError=?,acceptedAt=')) {
            const notification = state.notifications.get(this.values[4]);
            if (notification) Object.assign(notification, { deliveryStatus: this.values[0], deliveryError: this.values[1], acceptedAt: this.values[2], messageId: this.values[3] });
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET deliveryStatus=?,deliveryError=? WHERE id=')) {
            const notification = state.notifications.get(this.values[2]);
            if (notification) Object.assign(notification, { deliveryStatus: this.values[0], deliveryError: this.values[1] });
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET nome=? WHERE userId=')) {
            for (const notification of state.notifications.values()) if (notification.userId === this.values[1]) notification.nome = this.values[0];
          }
          if (sql.startsWith('UPDATE "RegistrationNotification" SET email=? WHERE userId=')) {
            for (const notification of state.notifications.values()) if (notification.userId === this.values[1]) notification.email = this.values[0];
          }
          if (sql.startsWith('DELETE FROM "EmailVerification" WHERE userId=?')) {
            for (const [id, verification] of state.emailVerifications) if (verification.userId === this.values[0] && (verification.usedAt === null || !sql.includes("usedAt IS NULL"))) state.emailVerifications.delete(id);
          }
          if (sql.startsWith('DELETE FROM "RegistrationNotification" WHERE userId=')) {
            for (const [id, notification] of state.notifications) if (notification.userId === this.values[0]) state.notifications.delete(id);
          }
          if (sql.startsWith('DELETE FROM "Session" WHERE tokenHash=')) state.sessions.delete(this.values[0]);
          if (sql.startsWith('DELETE FROM "Session" WHERE userId=')) {
            for (const [tokenHash, session] of state.sessions) if (session.userId === this.values[0]) state.sessions.delete(tokenHash);
          }
          if (sql.startsWith("DELETE FROM")) state.deletedSql.push(sql);
          return { success: true, meta: { changes: 1 } };
        },
        async all() {
          if (sql.startsWith("PRAGMA table_info")) return { results: [] };
          if (sql.includes('FROM "RegistrationNotification" WHERE attempts<5')) return { results: [...state.notifications.values()].filter(notification => notification.attempts < 5 && notification.deliveryStatus !== "sent") };
          if (sql.includes('FROM "BookProject" p LEFT JOIN "BookChapter"')) return { results: [] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM "Session" s JOIN "User" u')) {
            const session = state.sessions.get(this.values[0]);
            return session ? state.usersById.get(session.userId) : null;
          }
          if (sql.includes('SELECT id FROM "User" WHERE lower(trim(email))=')) return state.usersByEmail.get(this.values[0]) || null;
          if (sql.includes('SELECT * FROM "User" WHERE lower(trim(email))=')) return state.usersByEmail.get(this.values[0]) || null;
          if (sql.includes('FROM "EmailVerification" ev JOIN "User"')) {
            const verification = [...state.emailVerifications.values()].find(item => item.tokenHash === this.values[0]);
            return verification ? { ...verification, email: state.usersById.get(verification.userId)?.email, emailVerifiedAt: state.usersById.get(verification.userId)?.emailVerifiedAt } : null;
          }
          if (sql.startsWith('SELECT\n    (SELECT COUNT(*) FROM "BookProject"')) return { projects: 0, orders: 0 };
          return null;
        }
      };
    },
    async batch(statements) {
      state.registrationBatchSize = statements.length;
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    }
  };
  return { db, state };
}

const registration = registrationDb();
const newEmail = "nuova.cliente@example.com", newPassword = "PasswordNuova2026!";
const mismatchResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: "errore@example.com", nome: "Errore", password: newPassword, passwordConfirm: "PasswordDiversa2026!", privacyRead: "yes" }) }), { ...env, DB: registration.db });
const mismatchHtml = await mismatchResponse.text();
if (mismatchResponse.status !== 200 || !mismatchHtml.includes("Le due password non coincidono") || !mismatchHtml.includes('value="errore@example.com"') || registration.state.insertedUsers !== 0) throw new Error("Registrazione: password discordanti non gestite correttamente");

let registrationThrottleReads = 0, blockedRegistrationInsert = false;
const blockedRegistrationDb = {
  prepare(sql) { return { values: [], bind(...values) { this.values = values; return this; }, async run() { if (sql.startsWith('INSERT INTO "User"')) blockedRegistrationInsert = true; return { success: true, meta: { changes: 1 } }; }, async all() { return { results: [] }; }, async first() { if (sql.includes('SELECT * FROM "AuthThrottle"')) { registrationThrottleReads += 1; return registrationThrottleReads === 2 ? { attempts: 8, windowStart: new Date().toISOString(), blockedUntil: new Date(Date.now() + 60000).toISOString() } : null; } return null; } }; },
  async batch(statements) { for (const statement of statements) await statement.run(); return statements.map(() => ({ success: true })); }
};
const blockedRegistration = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", headers: { "cf-connecting-ip": "203.0.113.42" }, body: new URLSearchParams({ email: "altra@example.com", nome: "Altra Cliente", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: blockedRegistrationDb });
if (blockedRegistration.status !== 200 || !(await blockedRegistration.text()).includes("Troppe registrazioni o tentativi da questa connessione") || blockedRegistrationInsert) throw new Error("Registrazione: il limite per indirizzo di rete è aggirabile cambiando email");

let registrationEmail = null, welcomeEmail = null;
const registerResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: newEmail, nome: "Nuova Cliente", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: registration.db, CONTACT_EMAIL: { async send(message) { if (message.to === newEmail) welcomeEmail = message; else registrationEmail = message; return { messageId: message.to === newEmail ? "welcome-message-id" : "registration-message-id" }; } } });
const firstCookie = registerResponse.headers.get("set-cookie")?.match(/^spl_session=([^;]+)/)?.[1];
if (registerResponse.status !== 303 || registerResponse.headers.get("location") !== "/studio" || !firstCookie || registration.state.insertedUsers !== 1 || registration.state.registrationBatchSize !== 2) throw new Error("Registrazione: creazione atomica di account e sessione non riuscita");
if (!registration.state.passwordHash.startsWith("pbkdf2$100000$")) throw new Error("Registrazione: hash password non compatibile con Cloudflare Workers");
if (registrationEmail?.to !== env.ADMIN_EMAIL || !registrationEmail?.subject?.includes("Nuova iscrizione a Splendoria") || !registrationEmail?.text?.includes("Nuova Cliente") || !registrationEmail?.text?.includes(newEmail) || registrationEmail?.text?.includes(newPassword)) throw new Error("Registrazione: notifica email all’amministratore assente o non sicura");
const emailVerificationToken = welcomeEmail?.text?.match(/verifica-email\?token=([a-f0-9]+)/)?.[1];
const storedEmailVerification = [...registration.state.emailVerifications.values()][0];
if (welcomeEmail?.to !== newEmail || !welcomeEmail?.subject?.includes("Benvenuto in Splendoria") || !welcomeEmail?.text?.includes("Guida completa") || !emailVerificationToken || storedEmailVerification?.deliveryStatus !== "sent" || storedEmailVerification?.messageId !== "welcome-message-id") throw new Error("Registrazione: email di benvenuto e verifica non consegnata o non tracciata");
const storedRegistrationNotification = [...registration.state.notifications.values()][0];
if (storedRegistrationNotification?.deliveryStatus !== "sent" || storedRegistrationNotification?.attempts !== 1 || storedRegistrationNotification?.messageId !== "registration-message-id" || !storedRegistrationNotification?.acceptedAt) throw new Error("Registrazione: esito della notifica email non tracciato su D1");

const studioAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
const studioAfterRegistrationHtml = await studioAfterRegistration.text();
const studioNavigation = studioAfterRegistrationHtml.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || "";
if (studioAfterRegistration.status !== 200 || !studioAfterRegistrationHtml.includes("Ciao, Nuova Cliente") || !studioAfterRegistrationHtml.includes("Verifica il tuo indirizzo email") || !studioAfterRegistrationHtml.includes('action="/reinvia-verifica-email"') || ["Come funziona", "Listino", "Guida", "Contattaci", "Il mio Studio", "Account", "Esci"].some(label => !studioNavigation.includes(label))) throw new Error("Registrazione: accesso immediato, verifica email o menu completo dello Studio non riusciti");
let unverifiedMuseCalls = 0;
const unverifiedMuseResponse = await worker.fetch(new Request("https://www.splendoria.vip/api/musa/trascrizione", { method: "POST", headers: { cookie: `spl_session=${firstCookie}`, "content-type": "application/json" }, body: JSON.stringify({ text: "Abbiamo uscito di casa", language: "it-IT" }) }), { ...env, DB: registration.db, AI: { async run() { unverifiedMuseCalls += 1; return { response: "Siamo usciti di casa" }; } } });
if (unverifiedMuseResponse.status !== 403 || unverifiedMuseCalls !== 0 || !(await unverifiedMuseResponse.json()).error?.includes("Verifica prima")) throw new Error("Registrazione: un account non verificato può usare la Musa");
const verifiedEmailResponse = await worker.fetch(new Request(`https://www.splendoria.vip/verifica-email?token=${emailVerificationToken}`, { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
const verifiedEmailHtml = await verifiedEmailResponse.text();
if (verifiedEmailResponse.status !== 200 || !verifiedEmailHtml.includes("Indirizzo verificato") || !registration.state.usersByEmail.get(newEmail)?.emailVerifiedAt) throw new Error("Registrazione: collegamento di verifica valido non attiva l’account");
const studioAfterVerification = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
if ((await studioAfterVerification.text()).includes("Verifica il tuo indirizzo email")) throw new Error("Registrazione: avviso di verifica ancora visibile dopo la conferma");

const logoutAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/esci", { method: "POST", headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
if (logoutAfterRegistration.status !== 303 || !logoutAfterRegistration.headers.get("location")?.startsWith("/area-clienti?e=") || !logoutAfterRegistration.headers.get("set-cookie")?.includes("Max-Age=0")) throw new Error("Registrazione: uscita o cancellazione della sessione non riuscita");

const studioAfterLogout = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${firstCookie}` } }), { ...env, DB: registration.db });
if (studioAfterLogout.status !== 303 || studioAfterLogout.headers.get("location") !== "/area-clienti") throw new Error("Registrazione: sessione precedente ancora attiva dopo l’uscita");

const loginAfterRegistration = await worker.fetch(new Request("https://www.splendoria.vip/area-clienti", { method: "POST", body: new URLSearchParams({ email: newEmail, password: newPassword }) }), { ...env, DB: registration.db });
const secondCookie = loginAfterRegistration.headers.get("set-cookie")?.match(/^spl_session=([^;]+)/)?.[1];
if (loginAfterRegistration.status !== 303 || loginAfterRegistration.headers.get("location") !== "/studio" || !secondCookie || secondCookie === firstCookie) throw new Error("Registrazione: nuovo accesso con le credenziali create non riuscito");
const studioAfterLogin = await worker.fetch(new Request("https://www.splendoria.vip/studio", { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
if (studioAfterLogin.status !== 200 || !(await studioAfterLogin.text()).includes("Ciao, Nuova Cliente")) throw new Error("Registrazione: rientro nello Studio non riuscito");
console.log("/registrazione: conferma password, accesso, uscita e nuovo accesso verificati");

const accountResponse = await worker.fetch(new Request("https://www.splendoria.vip/account", { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
const accountHtml = await accountResponse.text();
if (accountResponse.status !== 200 || !accountHtml.includes("Il mio account") || !accountHtml.includes('action="/account/profilo"') || !accountHtml.includes('action="/account/email"') || !accountHtml.includes('href="/account/esporta.json"') || !accountHtml.includes('action="/account/cancella"') || !accountHtml.includes("Indirizzo verificato") || accountResponse.headers.get("x-robots-tag") !== "noindex, nofollow, noarchive") throw new Error("Account: pagina self-service incompleta o indicizzabile");

const badAccountEmail = await worker.fetch(new Request("https://www.splendoria.vip/account/email", { method: "POST", headers: { cookie: `spl_session=${secondCookie}` }, body: new URLSearchParams({ email: "cambio@example.com", password: "PasswordErrata2026!" }) }), { ...env, DB: registration.db });
if (badAccountEmail.status !== 200 || !(await badAccountEmail.text()).includes("password attuale non è corretta") || registration.state.usersById.values().next().value.email !== newEmail) throw new Error("Account: cambio email senza password corretta non bloccato");

const profileResponse = await worker.fetch(new Request("https://www.splendoria.vip/account/profilo", { method: "POST", headers: { cookie: `spl_session=${secondCookie}` }, body: new URLSearchParams({ nome: "Autrice Digitale" }) }), { ...env, DB: registration.db });
if (profileResponse.status !== 200 || !(await profileResponse.text()).includes("Nome aggiornato correttamente") || registration.state.usersByEmail.get(newEmail)?.nome !== "Autrice Digitale" || [...registration.state.notifications.values()][0]?.nome !== "Autrice Digitale") throw new Error("Account: modifica autonoma del nome non riuscita");

const exportResponse = await worker.fetch(new Request("https://www.splendoria.vip/account/esporta.json", { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
const exportedData = await exportResponse.json();
if (exportResponse.status !== 200 || !exportResponse.headers.get("content-disposition")?.includes("splendoria-i-miei-dati-") || exportedData.account?.email !== newEmail || exportedData.account?.nome !== "Autrice Digitale" || !Array.isArray(exportedData.projects) || JSON.stringify(exportedData).includes("passwordHash")) throw new Error("Account: esportazione dei dati incompleta o non sicura");

let changedAddressEmail = null;
const changedEmail = "autrice.digitale@example.com";
const accountEmailResponse = await worker.fetch(new Request("https://www.splendoria.vip/account/email", { method: "POST", headers: { cookie: `spl_session=${secondCookie}` }, body: new URLSearchParams({ email: changedEmail, password: newPassword }) }), { ...env, DB: registration.db, CONTACT_EMAIL: { async send(message) { changedAddressEmail = message; return { messageId: "changed-address-id" }; } } });
const accountEmailHtml = await accountEmailResponse.text();
const changedAddressToken = changedAddressEmail?.text?.match(/verifica-email\?token=([a-f0-9]+)/)?.[1];
if (accountEmailResponse.status !== 200 || !accountEmailHtml.includes("Email aggiornata") || !accountEmailHtml.includes("Verifica il tuo indirizzo email") || changedAddressEmail?.to !== changedEmail || !changedAddressToken || registration.state.usersByEmail.has(newEmail) || registration.state.usersByEmail.get(changedEmail)?.emailVerifiedAt !== null) throw new Error("Account: cambio e nuova verifica dell’email non riusciti");
const changedAddressVerification = await worker.fetch(new Request(`https://www.splendoria.vip/verifica-email?token=${changedAddressToken}`, { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
if (changedAddressVerification.status !== 200 || !(await changedAddressVerification.text()).includes("Indirizzo verificato") || !registration.state.usersByEmail.get(changedEmail)?.emailVerifiedAt) throw new Error("Account: il nuovo indirizzo non può essere verificato");

const refusedDeletion = await worker.fetch(new Request("https://www.splendoria.vip/account/cancella", { method: "POST", headers: { cookie: `spl_session=${secondCookie}` }, body: new URLSearchParams({ confirmation: "NO", password: newPassword }) }), { ...env, DB: registration.db });
if (refusedDeletion.status !== 200 || !(await refusedDeletion.text()).includes("scrivere esattamente CANCELLA") || registration.state.accountDeleted) throw new Error("Account: cancellazione senza conferma rafforzata non bloccata");
const deletedAccountResponse = await worker.fetch(new Request("https://www.splendoria.vip/account/cancella", { method: "POST", headers: { cookie: `spl_session=${secondCookie}` }, body: new URLSearchParams({ confirmation: "CANCELLA", password: newPassword }) }), { ...env, DB: registration.db });
if (deletedAccountResponse.status !== 303 || !deletedAccountResponse.headers.get("location")?.startsWith("/area-clienti?e=") || !deletedAccountResponse.headers.get("set-cookie")?.includes("Max-Age=0") || !registration.state.accountDeleted || registration.state.sessions.size !== 0 || registration.state.emailVerifications.size !== 0 || registration.state.notifications.size !== 0 || !registration.state.deletedSql.some(sql => sql.startsWith('DELETE FROM "BookProject"'))) throw new Error("Account: cancellazione e anonimizzazione non riuscite");
const accountAuditActions = registration.state.auditEvents.map(event => event.action);
if (!["account.registered", "account.email_verified", "account.login", "account.profile_changed", "account.data_exported", "account.email_changed", "account.deleted"].every(action => accountAuditActions.includes(action)) || registration.state.auditEvents.some(event => !event.actorHash || !event.targetHash || /nuova\.cliente|Autrice Digitale/i.test(event.metadata))) throw new Error("Audit: eventi account mancanti o dati anagrafici salvati in chiaro");
const deletedSessionResponse = await worker.fetch(new Request("https://www.splendoria.vip/account", { headers: { cookie: `spl_session=${secondCookie}` } }), { ...env, DB: registration.db });
if (deletedSessionResponse.status !== 303 || deletedSessionResponse.headers.get("location") !== "/area-clienti") throw new Error("Account: sessione ancora valida dopo la cancellazione");
console.log("/account: profilo, email, esportazione, cancellazione e anonimizzazione verificati");

const retryRegistration = registrationDb();
let retrySendAttempts = 0;
const failedRegistrationResponse = await worker.fetch(new Request("https://www.splendoria.vip/registrati", { method: "POST", body: new URLSearchParams({ email: "ritenta@example.com", nome: "Cliente Ritento", password: newPassword, passwordConfirm: newPassword, privacyRead: "yes" }) }), { ...env, DB: retryRegistration.db, CONTACT_EMAIL: { async send() { retrySendAttempts += 1; const error = new Error("Servizio temporaneamente non disponibile"); error.code = "E_TEMPORARY"; throw error; } } });
if (failedRegistrationResponse.status !== 303 || [...retryRegistration.state.notifications.values()][0]?.deliveryStatus !== "failed" || [...retryRegistration.state.emailVerifications.values()][0]?.deliveryStatus !== "failed" || retrySendAttempts !== 2) throw new Error("Registrazione: errore temporaneo delle email non registrato");
await worker.scheduled({}, { ...env, DB: retryRegistration.db, ADMIN_EMAIL_NOTIFICATION: { async send(message) { retrySendAttempts += 1; registrationEmail = message; return { messageId: "registration-retry-id" }; } } });
const retriedNotification = [...retryRegistration.state.notifications.values()][0];
if (retrySendAttempts !== 3 || retriedNotification?.deliveryStatus !== "sent" || retriedNotification?.attempts !== 2 || retriedNotification?.messageId !== "registration-retry-id") throw new Error("Registrazione: ritento automatico della notifica non riuscito");
console.log("/registrazione: email reale tracciata e ritento automatico verificato");

function resetDb() {
  const state = { inserted: null, delivery: null };
  return {
    state,
    db: {
      prepare(sql) {
        return {
          values: [],
          bind(...values) { this.values = values; return this; },
          async run() {
            if (sql.startsWith('INSERT INTO "PasswordReset"')) state.inserted = this.values;
            if (sql.startsWith('UPDATE "PasswordReset" SET deliveryStatus=')) state.delivery = this.values;
            return { success: true };
          },
          async all() {
            if (sql.startsWith("PRAGMA table_info")) return { results: [{ name: "projectId" }, { name: "termsAcceptedAt" }, { name: "privacyAcceptedAt" }, { name: "specialDataConsentAt" }, { name: "deliveryStatus" }, { name: "deliveryError" }, { name: "deliveredAt" }, { name: "messageId" }] };
            return { results: [] };
          },
          async first() {
            if (sql.includes('SELECT id,email,nome FROM "User" WHERE lower(trim(email))=')) return { id: "ulli-id", email: "ulli@apple.bz", nome: "Ulli" };
            return null;
          }
        };
      },
      async batch(statements) { return statements.map(() => ({ success: true })); }
    }
  };
}

let sentEmail = null;
const successfulReset = resetDb();
const resetResponse = await worker.fetch(new Request("https://www.splendoria.vip/password-dimenticata", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz" }) }), { ...env, DB: successfulReset.db, CONTACT_EMAIL: { async send(message) { sentEmail = message; return { messageId: "test-message-id" }; } } });
if (resetResponse.status !== 200 || sentEmail?.to !== "ulli@apple.bz" || !sentEmail?.text?.includes("https://www.splendoria.vip/reimposta-password?token=")) throw new Error("Recupero password: email strutturata non generata");
if (successfulReset.state.delivery?.[0] !== "sent" || successfulReset.state.delivery?.[3] !== "test-message-id") throw new Error("Recupero password: esito positivo non registrato");

const failedReset = resetDb();
const failedResetResponse = await worker.fetch(new Request("https://www.splendoria.vip/password-dimenticata", { method: "POST", body: new URLSearchParams({ email: "ulli@apple.bz" }) }), { ...env, DB: failedReset.db, CONTACT_EMAIL: { async send() { const error = new Error("Mittente non verificato"); error.code = "E_SENDER_NOT_VERIFIED"; throw error; } } });
if (failedResetResponse.status !== 200 || failedReset.state.delivery?.[0] !== "failed" || !failedReset.state.delivery?.[1]?.includes("E_SENDER_NOT_VERIFIED")) throw new Error("Recupero password: errore di consegna non registrato");
console.log("/password-dimenticata: invio e diagnostica verificati");

const migratedResetSchemaState = { schemaWrites: 0, batchSize: 0 };
const migratedResetSchemaDb = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (/^(?:ALTER|CREATE|PRAGMA)/i.test(sql.trim())) migratedResetSchemaState.schemaWrites += 1;
        return { success: true };
      },
      async all() { return { results: [] }; },
      async first() {
        if (sql.includes('SELECT pr.*,u.email FROM "PasswordReset"')) {
          return { id: "reset-storico", userId: "cliente-storico", email: "cliente@example.com", usedAt: null, expiresAt: new Date(Date.now() + 60000).toISOString() };
        }
        return null;
      }
    };
  },
  async batch(statements) { migratedResetSchemaState.batchSize = statements.length; return statements.map(() => ({ success: true })); }
};
const migratedResetToken = "a".repeat(64), migratedResetPassword = "NuovaPassword2026!";
const migratedResetResponse = await worker.fetch(new Request("https://www.splendoria.vip/reimposta-password", { method: "POST", body: new URLSearchParams({ token: migratedResetToken, password: migratedResetPassword, passwordConfirm: migratedResetPassword }) }), { ...env, DB: migratedResetSchemaDb });
if (migratedResetResponse.status !== 303 || !migratedResetResponse.headers.get("location")?.startsWith("/area-clienti?e=") || migratedResetSchemaState.schemaWrites !== 0 || migratedResetSchemaState.batchSize !== 3 || !migrationSource.includes('"usedAt" TEXT')) throw new Error("Recupero password: schema versionato o salvataggio non riusciti");
console.log("/reimposta-password: migrazione versionata e nuova password salvata");
