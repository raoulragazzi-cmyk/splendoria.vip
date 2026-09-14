import flowWorker from "./i18n-flow-worker.js";

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

function errorCopy(locale) {
  return locale === "de"
    ? {
        title: "Vorübergehendes Problem",
        message: "Der Vorgang konnte nicht abgeschlossen werden. Deine Spracheinstellung bleibt erhalten. Lade die Seite neu und versuche es erneut. Wenn das Problem bestehen bleibt, gehe zurück zu deinem Studio.",
        action: "Zurück zum Studio",
        json: "Der Vorgang konnte wegen eines vorübergehenden Problems nicht abgeschlossen werden. Versuche es erneut."
      }
    : {
        title: "Temporary problem",
        message: "The operation could not be completed. Your language setting has been preserved. Reload the page and try again. If the problem continues, return to your Studio.",
        action: "Back to Studio",
        json: "The operation could not be completed because of a temporary problem. Try again."
      };
}

function commonHeaders(locale, contentType) {
  return {
    "content-type": contentType,
    "content-language": locale,
    "cache-control": "private, no-store, max-age=0",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "x-content-type-options": "nosniff"
  };
}

function wantsJson(request, pathname) {
  const type = request.headers.get("content-type") || "";
  return type.includes("application/json") || /\/(?:autosalva|autosalva-progetto)$/.test(pathname);
}

function localizedFailure(request, locale, status = 500) {
  const url = new URL(request.url);
  const copy = errorCopy(locale);
  if (wantsJson(request, url.pathname)) {
    return new Response(JSON.stringify({ error: copy.json }), {
      status,
      headers: commonHeaders(locale, "application/json; charset=utf-8")
    });
  }
  const lang = locale === "de" ? "de" : "en";
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${copy.title} · Splendoria</title><style>body{margin:0;background:#f2f7f3;color:#102d29;font-family:Inter,system-ui,sans-serif;line-height:1.55}.shell{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(620px,100%);box-sizing:border-box;background:#fff;border:1px solid #d8e1dc;border-radius:24px;padding:38px;box-shadow:0 18px 55px rgba(16,45,41,.1)}h1{font-family:Georgia,serif;font-size:42px;margin:0 0 16px}.button{display:inline-flex;margin-top:18px;padding:12px 22px;border-radius:999px;background:#119b8d;color:#fff;text-decoration:none;font-weight:700}</style></head><body><main class="shell"><section class="card" role="alert"><h1>${copy.title}</h1><p>${copy.message}</p><a class="button" href="/${locale}/studio">${copy.action}</a></section></main></body></html>`;
  return new Response(html, {
    status,
    headers: commonHeaders(locale, "text/html; charset=utf-8")
  });
}

async function fetchFailsafe(request, env, ctx) {
  const locale = localeFromPath(new URL(request.url).pathname);
  if (!locale) return flowWorker.fetch(request, env, ctx);
  try {
    const response = await flowWorker.fetch(request, env, ctx);
    if (response.status >= 500) return localizedFailure(request, locale, response.status);
    return response;
  } catch (error) {
    console.error("splendoria_i18n_localized_request_failed", {
      locale,
      method: request.method,
      pathname: new URL(request.url).pathname,
      error: error instanceof Error ? error.message : String(error)
    });
    return localizedFailure(request, locale);
  }
}

export default {
  fetch: fetchFailsafe,
  email(message, env, ctx) { return flowWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return flowWorker.scheduled(controller, env, ctx); }
};
