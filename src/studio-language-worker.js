import appWorker from "./i18n-email-worker.js";

const SUPPORTED = new Set(["it-IT", "de-DE", "en-GB"]);
const LANGUAGE_LABELS = {
  "it-IT": { it: "Italiano", de: "Italienisch", en: "Italian" },
  "de-DE": { it: "Tedesco", de: "Deutsch", en: "German" },
  "en-GB": { it: "Inglese", de: "Englisch", en: "English" }
};
const DEFAULT_PREF = Object.freeze({
  bookLanguage: "it-IT",
  museOutputLanguage: "it-IT",
  dictationLanguage: "it-IT"
});

const ITALIAN_STANDARD_BLOCK = /Applica rigorosamente l'italiano standard contemporaneo\.[\s\S]*?Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa\./gi;

let languageTableReady = false;

function cleanLanguage(value, fallback = "it-IT") {
  return SUPPORTED.has(String(value || "")) ? String(value) : fallback;
}

function uiLocale(pathname) {
  if (/^\/de(?:\/|$)/.test(pathname)) return "de";
  if (/^\/en(?:\/|$)/.test(pathname)) return "en";
  return "it";
}

function canonicalPath(pathname) {
  const stripped = String(pathname || "/").replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped || "/";
}

function localizedPath(locale, pathname) {
  const canonical = canonicalPath(pathname);
  if (locale === "it") return canonical;
  return canonical === "/" ? `/${locale}/` : `/${locale}${canonical}`;
}

function projectIdFromPath(pathname) {
  const match = canonicalPath(pathname).match(/^\/libro\/([^/]+)(?:\/|$)/);
  return match?.[1] || "";
}

function isPrivateStudioPath(pathname) {
  const path = canonicalPath(pathname);
  return path === "/studio" || path === "/account" || path.startsWith("/account/") || path.startsWith("/libro/");
}

async function ensureLanguageTable(env) {
  if (languageTableReady || !env?.DB?.prepare) return languageTableReady;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS "BookLanguagePreference" (
      "projectId" TEXT NOT NULL PRIMARY KEY,
      "bookLanguage" TEXT NOT NULL DEFAULT 'it-IT',
      "museOutputLanguage" TEXT NOT NULL DEFAULT 'it-IT',
      "dictationLanguage" TEXT NOT NULL DEFAULT 'it-IT',
      "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("projectId") REFERENCES "BookProject"("id") ON DELETE CASCADE
    )`).run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS "BookLanguagePreference_updatedAt_idx" ON "BookLanguagePreference"("updatedAt")').run();
    languageTableReady = true;
  } catch (error) {
    console.error(JSON.stringify({ event: "book_language_table_unavailable", message: String(error?.message || error) }));
  }
  return languageTableReady;
}

async function readPreference(env, projectId) {
  if (!projectId || !(await ensureLanguageTable(env))) return { ...DEFAULT_PREF };
  try {
    const row = await env.DB.prepare('SELECT bookLanguage, museOutputLanguage, dictationLanguage FROM "BookLanguagePreference" WHERE projectId=?').bind(projectId).first();
    if (!row) return { ...DEFAULT_PREF };
    const bookLanguage = cleanLanguage(row.bookLanguage);
    return {
      bookLanguage,
      museOutputLanguage: cleanLanguage(row.museOutputLanguage, bookLanguage),
      dictationLanguage: cleanLanguage(row.dictationLanguage, bookLanguage)
    };
  } catch (error) {
    console.error(JSON.stringify({ event: "book_language_read_failed", projectId, message: String(error?.message || error) }));
    return { ...DEFAULT_PREF };
  }
}

async function writePreference(env, projectId, values) {
  if (!projectId || !(await ensureLanguageTable(env))) return false;
  const bookLanguage = cleanLanguage(values?.bookLanguage);
  const museOutputLanguage = cleanLanguage(values?.museOutputLanguage, bookLanguage);
  const dictationLanguage = cleanLanguage(values?.dictationLanguage, bookLanguage);
  try {
    await env.DB.prepare(`INSERT INTO "BookLanguagePreference" (projectId, bookLanguage, museOutputLanguage, dictationLanguage, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(projectId) DO UPDATE SET
        bookLanguage=excluded.bookLanguage,
        museOutputLanguage=excluded.museOutputLanguage,
        dictationLanguage=excluded.dictationLanguage,
        updatedAt=CURRENT_TIMESTAMP`)
      .bind(projectId, bookLanguage, museOutputLanguage, dictationLanguage).run();
    return true;
  } catch (error) {
    console.error(JSON.stringify({ event: "book_language_write_failed", projectId, message: String(error?.message || error) }));
    return false;
  }
}

function languageStandardDirective(language) {
  if (language === "de-DE") {
    return "Applica rigorosamente il tedesco standard contemporaneo (Hochdeutsch). Correggi grammatica, ortografia e punteggiatura senza alterare significato, tono, voce o fatti. Controlla casi, genere e numero, declinazioni, concordanze, reggenze, tempi verbali, posizione del verbo, verbi separabili, preposizioni e costruzione delle subordinate. Mantieni coerenti soggetto, punto di vista, riferimenti pronominali, cronologia e tempi verbali. Conserva regionalismi o dialetto soltanto nel discorso diretto quando sono presenti nelle fonti o richiesti dall'autore. Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa.";
  }
  if (language === "en-GB") {
    return "Applica rigorosamente l'inglese britannico standard contemporaneo. Correggi grammatica, spelling britannico e punteggiatura senza alterare significato, tono, voce o fatti. Controlla concordanze, tempi e aspetti verbali, articoli, pronomi, preposizioni, reggenze, struttura delle frasi e coerenza del registro. Mantieni coerenti soggetto, punto di vista, riferimenti pronominali, cronologia e tempi verbali. Conserva forme regionali o dialettali soltanto nel discorso diretto quando sono presenti nelle fonti o richieste dall'autore. Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa.";
  }
  return "";
}

function museLanguageDirective(language) {
  if (language === "de-DE") {
    return "LINGUA DELL'OPERA: TEDESCO. Tutto il testo narrativo destinato al libro deve essere in tedesco naturale, editoriale e coerente. Le istruzioni tecniche possono restare in italiano e non determinano la lingua dell'output. Non tradurre nomi propri, dati, citazioni, numeri o fatti forniti dall'autore. Mantieni invariati eventuali token tecnici tra parentesi quadre.";
  }
  if (language === "en-GB") {
    return "LINGUA DELL'OPERA: INGLESE BRITANNICO. Tutto il testo narrativo destinato al libro deve essere in inglese britannico naturale, editoriale e coerente. Le istruzioni tecniche possono restare in italiano e non determinano la lingua dell'output. Non tradurre nomi propri, dati, citazioni, numeri o fatti forniti dall'autore. Mantieni invariati eventuali token tecnici tra parentesi quadre.";
  }
  return "";
}

function replaceExplicitItalianInstruction(text, language) {
  if (language === "it-IT") return String(text || "");
  const target = language === "de-DE" ? "tedesco" : "inglese britannico";
  const literature = language === "de-DE" ? "letteratura tedesca e comparata" : "letteratura inglese e comparata";
  const prose = language === "de-DE" ? "prosa tedesca originale" : "prosa originale in inglese britannico";
  return String(text || "")
    .replace(ITALIAN_STANDARD_BLOCK, languageStandardDirective(language))
    .replace(/letteratura italiana e comparata/gi, literature)
    .replace(/prosa italiana originale/gi, prose)
    .replace(/per un libro in italiano\b/gi, `per un libro in ${target}`)
    .replace(/titoli di capitolo in italiano\b/gi, `titoli di capitolo in ${target}`)
    .replace(/domande in italiano\b/gi, `domande in ${target}`)
    .replace(/\bin italiano\b/gi, `in ${target}`);
}

function isMachineControlPrompt(options) {
  const systems = Array.isArray(options?.messages)
    ? options.messages.filter(message => message?.role === "system").map(message => String(message?.content || ""))
    : [];
  return systems.some(text => /APPROVATO|RIFIUTATO/.test(text) && /controllo qualit|valuta/i.test(text));
}

export function localizeMuseOptions(options, language) {
  const normalized = cleanLanguage(language);
  if (normalized === "it-IT" || !options || typeof options !== "object" || isMachineControlPrompt(options)) return options;
  const directive = museLanguageDirective(normalized);
  const out = { ...options };
  if (Array.isArray(options.messages)) {
    out.messages = options.messages.map(message => {
      if (!message || message.role !== "system") return message;
      const content = replaceExplicitItalianInstruction(message.content, normalized);
      return { ...message, content: `${directive}\n\n${content}` };
    });
  }
  if (typeof options.prompt === "string") {
    out.prompt = `${directive}\n\n${replaceExplicitItalianInstruction(options.prompt, normalized)}`;
  }
  return out;
}

function envWithMuseLanguage(env, language) {
  const normalized = cleanLanguage(language);
  if (normalized === "it-IT" || !env?.AI?.run) return env;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  const binding = env.AI;
  wrapped.AI = {
    run(model, options) {
      return binding.run(model, localizeMuseOptions(options, normalized));
    }
  };
  return wrapped;
}

function escapeAttr(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function languageOptions(ui, selected) {
  return Object.entries(LANGUAGE_LABELS).map(([value, labels]) =>
    `<option value="${value}"${value === selected ? " selected" : ""}>${escapeAttr(labels[ui])}</option>`
  ).join("");
}

function localeSwitcher(url, ui) {
  const items = ["it", "de", "en"].map(locale => {
    const href = localizedPath(locale, url.pathname) + url.search;
    return `<a href="${escapeAttr(href)}" hreflang="${locale}"${locale === ui ? ' aria-current="page"' : ""}>${locale.toUpperCase()}</a>`;
  }).join("");
  return `<span class="studio-locale-switcher" data-studio-locale-switcher aria-label="${ui === "de" ? "Sprache der Benutzeroberfläche" : ui === "en" ? "Interface language" : "Lingua dell’interfaccia"}">${items}</span>`;
}

function injectLocaleSwitcher(html, url, ui) {
  if (html.includes("data-studio-locale-switcher")) return html;
  const switcher = localeSwitcher(url, ui);
  const marker = '<div class="navlinks">';
  if (!html.includes(marker)) return html;
  return html.replace(marker, `${marker}${switcher}`);
}

function languagePanel(ui, pref) {
  const copy = ui === "de" ? {
    eyebrow: "Sprache des Buches",
    title: "In welcher Sprache soll dein Buch geschrieben werden?",
    book: "Sprache des Buches",
    muse: "Ausgabesprache der Muse",
    help: "Die Sprache der Benutzeroberfläche ist davon unabhängig. Du kannst Splendoria auf Deutsch verwenden und dein Buch beispielsweise auf Italienisch schreiben. Die Sprache der Diktierfunktion bleibt ebenfalls separat wählbar. Speichere die Buchdaten, damit eine geänderte Buch- oder Muse-Sprache wirksam wird."
  } : ui === "en" ? {
    eyebrow: "Book language",
    title: "Which language should your book be written in?",
    book: "Book language",
    muse: "Muse output language",
    help: "This is independent of the interface language. You can use Splendoria in English while writing your book in Italian, German or English. Dictation remains a separate choice as well. Save the book settings after changing the book or Muse language."
  } : {
    eyebrow: "Lingua del libro",
    title: "In quale lingua vuoi scrivere il tuo libro?",
    book: "Lingua del libro",
    muse: "Lingua di output della Musa",
    help: "È indipendente dalla lingua dell’interfaccia. Puoi usare Splendoria in tedesco o inglese e scrivere comunque il libro in italiano. Anche la dettatura resta una scelta separata. Dopo una modifica, salva i dati del libro per applicare la nuova lingua."
  };
  return `<section class="book-language-panel" data-book-language-panel><p class="eyebrow">${copy.eyebrow}</p><h3>${copy.title}</h3><div class="grid two book-language-grid"><label class="field">${copy.book}<select name="bookLanguage" data-book-language>${languageOptions(ui, pref.bookLanguage)}</select></label><label class="field">${copy.muse}<select name="museOutputLanguage" data-muse-output-language>${languageOptions(ui, pref.museOutputLanguage)}</select></label></div><p class="small muted">${copy.help}</p></section>`;
}

function newBookLanguagePanel(ui) {
  const initial = ui === "de" ? "de-DE" : ui === "en" ? "en-GB" : "it-IT";
  const pref = { bookLanguage: initial, museOutputLanguage: initial, dictationLanguage: initial };
  return languagePanel(ui, pref);
}

function injectNewBookControls(html, ui) {
  if (html.includes("data-book-language-panel")) return html;
  const panel = newBookLanguagePanel(ui);
  const firstBookSlot = '<div data-first-book-language-slot></div>';
  if (html.includes(firstBookSlot)) return html.replace(firstBookSlot, panel);
  const formPattern = /(<form method="post" action="\/(?:de\/|en\/)?nuovo-libro">[\s\S]*?<div class="grid three">[\s\S]*?<\/div>)(<p class="small muted">)/;
  return html.replace(formPattern, `$1${panel}$2`);
}

function setDictationSelection(html, language) {
  if (!SUPPORTED.has(language)) return html;
  return html.replace(/<select([^>]*data-voice-language[^>]*)>([\s\S]*?)<\/select>/, (_all, attrs, options) => {
    const cleaned = options.replace(/ selected(?=>)/g, "");
    const selected = cleaned.replace(new RegExp(`<option value="${language}">`), `<option value="${language}" selected>`);
    const withForm = /\bform=/.test(attrs) ? attrs : `${attrs} name="dictationLanguage" form="spl-book-settings"`;
    return `<select${withForm}>${selected}</select>`;
  });
}

function injectEditorControls(html, ui, pref) {
  if (html.includes("data-book-language-panel")) return setDictationSelection(html, pref.dictationLanguage);
  let out = html.replace(/<form class="wow-panel"(?![^>]*\bid=)/, '<form class="wow-panel" id="spl-book-settings"');
  const panel = languagePanel(ui, pref);
  const settingsSlot = '<div data-editor-language-slot></div>';
  if (out.includes(settingsSlot)) out = out.replace(settingsSlot, panel);
  else out = out.replace(/(<form class="wow-panel"[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<\/h2>)/, `$1${panel}`);
  return setDictationSelection(out, pref.dictationLanguage);
}

function injectStudioLanguageCss(html) {
  if (html.includes("data-studio-language-css")) return html;
  const css = `<style data-studio-language-css>
.studio-locale-switcher{display:inline-flex;align-items:center;gap:3px;margin-right:4px;padding:3px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.06)}
.studio-locale-switcher a{min-width:31px;padding:6px 8px;border-radius:999px;text-align:center;font-size:12px!important;font-weight:850;letter-spacing:.05em;text-decoration:none!important;color:#dce9e4!important}
.studio-locale-switcher a[aria-current="page"]{background:#fff;color:#153f37!important}
.book-language-panel{margin:20px 0 24px;padding:20px 22px;border:1px solid #c8ded6;border-radius:18px;background:#f5fbf8}
.book-language-panel h3{margin:2px 0 10px;font-size:24px}
.book-language-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px}
.book-language-panel .field{margin:10px 0}
.book-language-panel .small{margin:8px 0 0;line-height:1.5}
@media(max-width:760px){.studio-locale-switcher{order:-1}.book-language-grid{grid-template-columns:1fr!important}.book-language-panel{padding:18px 16px}}
</style>`;
  return html.replace("</head>", `${css}</head>`);
}

function localizePrivateChrome(html, ui) {
  if (ui === "it") return html;
  const map = ui === "de" ? [
    ["La tua vita in un romanzo", "Dein Leben als Roman"],
    ["Partita IVA", "USt-IdNr."],
    ["Guida allo Studio", "Studio-Leitfaden"],
    ["Cookie e dati locali", "Cookies und lokale Daten"],
    ["Privacy, senza sorprese", "Datenschutz, ohne Überraschungen"],
    ["Ho capito", "Verstanden"]
  ] : [
    ["La tua vita in un romanzo", "Your life as a novel"],
    ["Partita IVA", "VAT number"],
    ["Guida allo Studio", "Studio Guide"],
    ["Cookie e dati locali", "Cookies and local data"],
    ["Privacy, senza sorprese", "Privacy, without surprises"],
    ["Ho capito", "Got it"]
  ];
  const scoped = value => map.reduce((out, [source, target]) => out.split(source).join(target), value);
  let out = html.replace(/<footer class="footer">[\s\S]*?<\/footer>/, block => scoped(block));
  out = out.replace(/<aside class="cookie-banner privacy-first"[\s\S]*?<\/aside>/, block => scoped(block));
  return out;
}

function valuesFromForm(formData, fallback = DEFAULT_PREF) {
  const bookLanguage = cleanLanguage(formData?.get("bookLanguage"), fallback.bookLanguage);
  return {
    bookLanguage,
    museOutputLanguage: cleanLanguage(formData?.get("museOutputLanguage"), bookLanguage),
    dictationLanguage: cleanLanguage(formData?.get("dictationLanguage"), bookLanguage)
  };
}

function successfulProjectRedirect(response, projectId = "") {
  if (response.status < 300 || response.status >= 400) return "";
  const location = response.headers.get("location");
  if (!location) return "";
  try {
    const target = new URL(location, "https://www.splendoria.vip");
    const id = projectIdFromPath(target.pathname);
    if (!id || (projectId && id !== projectId)) return "";
    return id;
  } catch {
    return "";
  }
}

async function studioLanguageFetch(request, env, ctx) {
  const url = new URL(request.url);
  const ui = uiLocale(url.pathname);
  const canonical = canonicalPath(url.pathname);
  const projectId = projectIdFromPath(url.pathname);
  let submitted = null;

  if (request.method === "POST" && (canonical === "/nuovo-libro" || (projectId && canonical === `/libro/${projectId}/salva`))) {
    try { submitted = await request.clone().formData(); } catch { submitted = null; }
  }

  let innerEnv = env;
  if (request.method === "POST" && projectId) {
    const pref = await readPreference(env, projectId);
    innerEnv = envWithMuseLanguage(env, pref.museOutputLanguage || pref.bookLanguage);
  }

  const response = await appWorker.fetch(request, innerEnv, ctx);

  if (submitted && canonical === "/nuovo-libro") {
    const newProjectId = successfulProjectRedirect(response);
    if (newProjectId) {
      const initial = ui === "de" ? "de-DE" : ui === "en" ? "en-GB" : "it-IT";
      const values = valuesFromForm(submitted, { bookLanguage: initial, museOutputLanguage: initial, dictationLanguage: initial });
      await writePreference(env, newProjectId, { ...values, dictationLanguage: values.bookLanguage });
    }
  } else if (submitted && projectId && successfulProjectRedirect(response, projectId)) {
    const previous = await readPreference(env, projectId);
    const values = valuesFromForm(submitted, previous);
    await writePreference(env, projectId, values);
  }

  const contentType = response.headers.get("content-type") || "";
  if (request.method !== "GET" || !response.ok || !contentType.includes("text/html") || !isPrivateStudioPath(url.pathname)) return response;

  let html = await response.text();
  html = injectLocaleSwitcher(html, url, ui);
  html = injectStudioLanguageCss(html);
  html = localizePrivateChrome(html, ui);

  if (canonical === "/studio") html = injectNewBookControls(html, ui);
  if (projectId && /^\/libro\/[^/]+$/.test(canonical)) {
    const pref = await readPreference(env, projectId);
    html = injectEditorControls(html, ui, pref);
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export {
  canonicalPath,
  injectEditorControls,
  injectLocaleSwitcher,
  injectNewBookControls,
  projectIdFromPath,
  readPreference,
  writePreference
};

export default {
  fetch: studioLanguageFetch,
  email(message, env, ctx) { return appWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return appWorker.scheduled(controller, env, ctx); }
};
