import editorLegalCopyWorker from "./i18n-editor-legal-copy-worker.js";

const LOCALES = new Set(["de", "en"]);

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

function copyFor(locale) {
  return locale === "de"
    ? {
        title: "Seite nicht gefunden",
        message: "Diese Seite ist nicht verfügbar oder wurde verschoben. Deine Spracheinstellung bleibt erhalten.",
        home: "Zur Startseite",
        studio: "Zum Studio"
      }
    : {
        title: "Page not found",
        message: "This page is unavailable or may have moved. Your language setting has been preserved.",
        home: "Back to home",
        studio: "Go to Studio"
      };
}

function headers(locale) {
  return {
    "content-type": "text/html; charset=utf-8",
    "content-language": locale,
    "cache-control": "private, no-store, max-age=0",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "x-content-type-options": "nosniff"
  };
}

function localizedNotFound(locale, headOnly = false) {
  const copy = copyFor(locale);
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${copy.title} · Splendoria</title><style>body{margin:0;background:#f2f7f3;color:#102d29;font-family:Inter,system-ui,sans-serif;line-height:1.55}.shell{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(620px,100%);box-sizing:border-box;background:#fff;border:1px solid #d8e1dc;border-radius:24px;padding:38px;box-shadow:0 18px 55px rgba(16,45,41,.1)}h1{font-family:Georgia,serif;font-size:42px;margin:0 0 16px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.button{display:inline-flex;padding:12px 22px;border-radius:999px;background:#119b8d;color:#fff;text-decoration:none;font-weight:700}.secondary{background:#fff;color:#102d29;border:1px solid #cad8d1}</style></head><body><main class="shell"><section class="card"><h1>${copy.title}</h1><p>${copy.message}</p><div class="actions"><a class="button" href="/${locale}/">${copy.home}</a><a class="button secondary" href="/${locale}/studio">${copy.studio}</a></div></section></main></body></html>`;
  return new Response(headOnly ? null : html, { status: 404, headers: headers(locale) });
}

async function fetchNotFound(request, env, ctx) {
  const response = await editorLegalCopyWorker.fetch(request, env, ctx);
  const url = new URL(request.url);
  const locale = localeFromPath(url.pathname);
  if (!LOCALES.has(locale) || response.status !== 404 || !["GET", "HEAD"].includes(request.method)) return response;
  return localizedNotFound(locale, request.method === "HEAD");
}

export default {
  fetch: fetchNotFound,
  email(message, env, ctx) { return editorLegalCopyWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return editorLegalCopyWorker.scheduled(controller, env, ctx); }
};
