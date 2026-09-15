import appWorker from "./i18n-email-worker.js";

const UI_LOCALES = new Set(["it", "de", "en"]);
const BOOK_LANGUAGES = new Set(["it", "de", "en"]);

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "it";
}

function stripLocale(pathname) {
  return pathname.replace(/^\/(?:de|en)(?=\/|$)/, "") || "/";
}

function withLocale(pathname, locale) {
  const base = stripLocale(pathname);
  if (locale === "it") return base;
  return base === "/" ? `/${locale}/` : `/${locale}${base}`;
}

function projectRoute(pathname) {
  const base = stripLocale(pathname);
  const match = base.match(/^\/libro\/([^/]+)(?:\/(.*))?$/);
  return match ? { projectId: match[1], suffix: match[2] || "" } : null;
}

function isPrivateClientPath(pathname) {
  const base = stripLocale(pathname);
  return base === "/studio" || base === "/account" || base.startsWith("/account/") || base.startsWith("/libro/");
}

function isAiProjectAction(pathname) {
  const route = projectRoute(pathname);
  if (!route) return false;
  return /^(?:migliora|affidati|struttura|intervista|risposte(?:\/migliora|\/affidati)?|capitolo\/[^/]+\/(?:genera|rifinisci))$/.test(route.suffix);
}

function safeLanguage(value, fallback = "it") {
  const language = String(value || "").trim().toLowerCase();
  return BOOK_LANGUAGES.has(language) ? language : fallback;
}

function narrativeInstruction(language) {
  if (language === "de") {
    return "Die Erzählsprache dieses Buchprojekts ist Deutsch. Erzeuge alle narrativen Ausgaben, Interviewfragen, Gliederungen, Kapiteltexte, Überarbeitungen, Überschriften und redaktionellen Hinweise auf Deutsch. Bewahre Namen, Fakten, Chronologie, Ton und ausdrücklich gelieferte Zitate; übersetze Zitate nicht, sofern der Nutzer dies nicht ausdrücklich verlangt. Die Sprachvorgabe darf niemals als Erlaubnis verstanden werden, Fakten zu erfinden.";
  }
  if (language === "en") {
    return "The narrative language of this book project is English. Produce all narrative output, interview questions, outlines, chapter text, revisions, headings and editorial feedback in English. Preserve names, facts, chronology, tone and explicitly supplied quotations; do not translate quotations unless the user explicitly asks. The language instruction must never be treated as permission to invent facts.";
  }
  return "La lingua narrativa di questo progetto editoriale è l’italiano. Produci in italiano tutti gli output narrativi, le domande di intervista, le strutture, i capitoli, le revisioni, i titoli e i commenti editoriali. Conserva nomi, fatti, cronologia, tono e citazioni fornite esplicitamente; non tradurre le citazioni salvo richiesta esplicita. La scelta della lingua non autorizza mai a inventare fatti.";
}

function withNarrativeLanguage(env, language) {
  if (!env?.AI?.run || language === "it") return env;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  const ai = env.AI;
  const instruction = narrativeInstruction(language);
  const wrappedAi = Object.create(ai);
  wrappedAi.run = (model, input, options) => {
    let next = input;
    if (input && typeof input === "object" && !Array.isArray(input)) {
      next = { ...input };
      if (Array.isArray(input.messages)) {
        const already = input.messages.some(message => message?.role === "system" && String(message?.content || "").includes("narrative language"));
        next.messages = already ? [...input.messages] : [{ role: "system", content: instruction }, ...input.messages];
      } else if (typeof input.prompt === "string") {
        next.prompt = `${instruction}\n\n${input.prompt}`;
      }
    } else if (typeof input === "string") {
      next = `${instruction}\n\n${input}`;
    }
    return ai.run(model, next, options);
  };
  wrapped.AI = wrappedAi;
  return wrapped;
}

async function languageFromRequest(request) {
  const headerLanguage = safeLanguage(request.headers.get("x-splendoria-book-language"), "");
  if (headerLanguage) return headerLanguage;
  if (request.method !== "POST") return "";
  const type = request.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) {
      const json = await request.clone().json();
      return safeLanguage(json?.bookLanguage, "");
    }
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const data = await request.clone().formData();
      return safeLanguage(data.get("bookLanguage"), "");
    }
  } catch {}
  return "";
}

async function projectLanguage(env, projectId) {
  if (!env?.DB || !projectId) return "it";
  try {
    const row = await env.DB.prepare('SELECT "bookLanguage" FROM "BookProjectLanguage" WHERE "projectId" = ? LIMIT 1')
      .bind(projectId)
      .first();
    return safeLanguage(row?.bookLanguage, "it");
  } catch {
    return "it";
  }
}

async function verifyProjectAccess(request, env, ctx, projectId, locale) {
  const url = new URL(request.url);
  url.pathname = withLocale(`/libro/${projectId}`, locale);
  url.search = "";
  const headers = new Headers(request.headers);
  headers.delete("content-type");
  headers.delete("content-length");
  const probe = new Request(url.toString(), { method: "GET", headers });
  const response = await appWorker.fetch(probe, env, ctx);
  return response.status === 200 && (response.headers.get("content-type") || "").includes("text/html");
}

async function saveProjectLanguage(request, env, ctx, route, locale) {
  let payload = {};
  try { payload = await request.json(); } catch {}
  const language = safeLanguage(payload?.bookLanguage, "");
  if (!language) return Response.json({ ok: false, error: "invalid_language" }, { status: 400 });
  const allowed = await verifyProjectAccess(request, env, ctx, route.projectId, locale);
  if (!allowed) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!env?.DB) return Response.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  try {
    await env.DB.prepare(`INSERT INTO "BookProjectLanguage" ("projectId", "bookLanguage", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT("projectId") DO UPDATE SET "bookLanguage" = excluded."bookLanguage", "updatedAt" = CURRENT_TIMESTAMP`)
      .bind(route.projectId, language)
      .run();
    return Response.json({ ok: true, bookLanguage: language }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "language_store_unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

function languageLinks(url, locale) {
  const label = locale === "de" ? "Sprache der Oberfläche" : locale === "en" ? "Interface language" : "Lingua interfaccia";
  const title = locale === "de" ? "Oberfläche wechseln" : locale === "en" ? "Switch interface" : "Cambia interfaccia";
  const links = ["it", "de", "en"].map(target => {
    const next = new URL(url.toString());
    next.pathname = withLocale(url.pathname, target);
    const active = target === locale ? ' aria-current="page" class="is-active"' : "";
    return `<a${active} href="${next.pathname}${next.search}" hreflang="${target}" lang="${target}">${target.toUpperCase()}</a>`;
  }).join("");
  return `<span class="spl-studio-language" aria-label="${label}" title="${title}">${links}</span>`;
}

function languageCss() {
  return `<style id="spl-studio-language-style">
.spl-studio-language{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.06);white-space:nowrap}
.spl-studio-language a{display:grid;place-items:center;min-width:31px;height:27px;padding:0 7px;border-radius:999px;color:#e6efec!important;font-size:11px;font-weight:850;letter-spacing:.06em;text-decoration:none!important}
.spl-studio-language a.is-active{background:#fff;color:#102d29!important}
.spl-book-language{margin:15px 0 18px;padding:15px 16px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.07)}
.spl-book-language label{display:block;margin-bottom:7px;color:#fff;font-size:13px;font-weight:850}
.spl-book-language select{width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,.28);border-radius:11px;background:#fff;color:#102d29;font:inherit;font-weight:750}
.spl-book-language p{margin:7px 0 0!important;color:#cfe0da!important;font-size:12px!important;line-height:1.45!important}
.spl-book-language-status{min-height:18px}
@media(max-width:820px){.navin{align-items:flex-start}.navlinks{gap:10px}.spl-studio-language{order:-1}.spl-studio-language a{min-width:29px}}
</style>`;
}

function bookLanguagePanel(locale, language, projectId, endpoint) {
  const copy = locale === "de" ? {
    label: "Sprache des Buches",
    help: "Unabhängig von Oberfläche und Diktierfunktion. Die Muse schreibt und überarbeitet das Buch in dieser Sprache.",
    saving: "Wird gespeichert…", saved: "Gespeichert", error: "Nicht gespeichert – bitte erneut versuchen.",
    options: [["it", "Italienisch"], ["de", "Deutsch"], ["en", "Englisch"]]
  } : locale === "en" ? {
    label: "Book language",
    help: "Independent from the interface and dictation language. The Muse writes and revises the book in this language.",
    saving: "Saving…", saved: "Saved", error: "Not saved — please try again.",
    options: [["it", "Italian"], ["de", "German"], ["en", "English"]]
  } : {
    label: "Lingua del libro",
    help: "Indipendente dall’interfaccia e dalla lingua di dettatura. La Musa scrive e revisiona il libro in questa lingua.",
    saving: "Salvataggio…", saved: "Salvata", error: "Non salvata — riprova.",
    options: [["it", "Italiano"], ["de", "Tedesco"], ["en", "Inglese"]]
  };
  const options = copy.options.map(([value, label]) => `<option value="${value}"${value === language ? " selected" : ""}>${label}</option>`).join("");
  return `<div class="spl-book-language" data-spl-book-language data-project-id="${projectId}" data-endpoint="${endpoint}" data-saving="${copy.saving}" data-saved="${copy.saved}" data-error="${copy.error}"><label for="spl-book-language-select">${copy.label}</label><select id="spl-book-language-select">${options}</select><p>${copy.help}</p><p class="spl-book-language-status" role="status" aria-live="polite"></p></div>`;
}

function studioLanguageScript(projectId, language) {
  const safeId = JSON.stringify(projectId || "");
  const initial = JSON.stringify(language || "it");
  return `<script id="spl-studio-language-script">(() => {
    const projectId = ${safeId};
    let bookLanguage = ${initial};
    const setFormLanguage = () => {
      if (!projectId) return;
      document.querySelectorAll('form').forEach(form => {
        const action = form.getAttribute('action') || '';
        if (!action.includes('/libro/' + projectId)) return;
        let input = form.querySelector('input[name="bookLanguage"]');
        if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = 'bookLanguage'; form.append(input); }
        input.value = bookLanguage;
      });
    };
    setFormLanguage();
    if (projectId) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init = {}) => {
        try {
          const url = new URL(typeof input === 'string' ? input : input.url, location.href);
          if (url.origin === location.origin && url.pathname.includes('/libro/' + projectId)) {
            const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
            headers.set('x-splendoria-book-language', bookLanguage);
            init = { ...init, headers };
          }
        } catch {}
        return originalFetch(input, init);
      };
    }
    const panel = document.querySelector('[data-spl-book-language]');
    const select = panel?.querySelector('select');
    const status = panel?.querySelector('.spl-book-language-status');
    if (!panel || !select) return;
    select.addEventListener('change', async () => {
      const next = select.value;
      if (!['it','de','en'].includes(next)) return;
      const previous = bookLanguage;
      bookLanguage = next;
      setFormLanguage();
      if (status) status.textContent = panel.dataset.saving || '';
      try {
        const response = await originalFetch(panel.dataset.endpoint, {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json', 'x-splendoria-book-language': next },
          body: JSON.stringify({ bookLanguage: next })
        });
        if (!response.ok) throw new Error('save failed');
        if (status) status.textContent = panel.dataset.saved || '';
      } catch {
        bookLanguage = previous; select.value = previous; setFormLanguage();
        if (status) status.textContent = panel.dataset.error || '';
      }
    });
  })();</script>`;
}

function localizeKnownPostProductionResiduals(html, locale) {
  let out = html;
  if (locale === "de") {
    out = out
      .replace(/29 agosto 2026/g, "29. August 2026")
      .replace(/12 agosto 2026/g, "12. August 2026")
      .replace(/>Trasparenza sull’intelligenza artificiale</g, ">Transparenz bei künstlicher Intelligenz<")
      .replace(/Guida allo Studio/g, "Studio-Leitfaden")
      .replace(/\bMerano e Via Settala\b/g, "Merano und Via Settala")
      .replace(/con indirizzo geografico in/g, "mit Anschrift in");
  } else if (locale === "en") {
    out = out
      .replace(/29 agosto 2026/g, "29 August 2026")
      .replace(/12 agosto 2026/g, "12 August 2026")
      .replace(/>Trasparenza sull’intelligenza artificiale</g, ">Artificial intelligence transparency<")
      .replace(/Guida allo Studio/g, "Studio Guide")
      .replace(/\bMerano e Via Settala\b/g, "Merano and Via Settala")
      .replace(/con indirizzo geografico in/g, "with registered address at");
  }
  return out;
}

async function enhanceHtml(response, request, env) {
  if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const url = new URL(request.url);
  const locale = localeFromPath(url.pathname);
  let html = await response.text();
  html = localizeKnownPostProductionResiduals(html, locale);
  let projectId = "";
  let language = "it";
  const route = projectRoute(url.pathname);
  if (route && !route.suffix) {
    projectId = route.projectId;
    language = await projectLanguage(env, projectId);
    const endpoint = `${withLocale(`/libro/${projectId}/lingua-libro`, locale)}`;
    const panel = bookLanguagePanel(locale, language, projectId, endpoint);
    if (html.includes('<div class="muse-voice">')) html = html.replace('<div class="muse-voice">', `${panel}<div class="muse-voice">`);
    else if (html.includes('</main>')) html = html.replace('</main>', `${panel}</main>`);
  }
  if (isPrivateClientPath(url.pathname)) {
    const switcher = languageLinks(url, locale);
    html = html.replace(/<div class="navlinks"([^>]*)>/, match => `${match}${switcher}`);
  }
  if (!html.includes('id="spl-studio-language-style"')) html = html.replace('</head>', `${languageCss()}</head>`);
  if (isPrivateClientPath(url.pathname) && !html.includes('id="spl-studio-language-script"')) html = html.replace('</body>', `${studioLanguageScript(projectId, language)}</body>`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

async function fetchStudioLanguage(request, env, ctx) {
  const url = new URL(request.url);
  const locale = localeFromPath(url.pathname);
  const route = projectRoute(url.pathname);

  if (request.method === "POST" && route?.suffix === "lingua-libro") {
    return saveProjectLanguage(request, env, ctx, route, locale);
  }

  let effectiveEnv = env;
  if (request.method === "POST" && route && isAiProjectAction(url.pathname)) {
    const language = await languageFromRequest(request) || await projectLanguage(env, route.projectId);
    effectiveEnv = withNarrativeLanguage(env, language);
  }

  const response = await appWorker.fetch(request, effectiveEnv, ctx);
  if (request.method !== "GET" && request.method !== "HEAD") return response;
  if (request.method === "HEAD") return response;
  return enhanceHtml(response, request, env);
}

export { narrativeInstruction, withNarrativeLanguage, languageLinks, localizeKnownPostProductionResiduals };

export default {
  fetch: fetchStudioLanguage,
  email(message, env, ctx) { return appWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return appWorker.scheduled(controller, env, ctx); }
};
