import notFoundWorker from "./i18n-notfound-worker.js";

const LOCALES = new Set(["de", "en"]);

function localeFromPath(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

export function localizeClientDeletePanel(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");
  return String(html || "").replace(/<details class="book-delete-panel[^>]*>[\s\S]*?<\/details>/g, block => {
    let out = block;
    const pairs = locale === "de"
      ? [
          [">Elimina libro</summary>", ">Buch löschen</summary>"],
          ["<h3>Eliminazione definitiva</h3>", "<h3>Endgültig löschen</h3>"],
          [">Elimina definitivamente questo libro</button>", ">Dieses Buch endgültig löschen</button>"]
        ]
      : [
          [">Elimina libro</summary>", ">Delete book</summary>"],
          ["<h3>Eliminazione definitiva</h3>", "<h3>Permanent deletion</h3>"],
          [">Elimina definitivamente questo libro</button>", ">Permanently delete this book</button>"]
        ];
    for (const [source, target] of pairs) out = out.split(source).join(target);
    return out;
  });
}

export function localizePrivateFooter(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");
  return String(html || "").replace(/<nav class="footer-links"[^>]*>[\s\S]*?<\/nav>/g, block => {
    let out = block;
    const pairs = locale === "de"
      ? [
          [">Guida allo Studio</a>", ">Studio-Leitfaden</a>"],
          [">Termini e condizioni</a>", ">Allgemeine Geschäftsbedingungen</a>"],
          [">Note legali</a>", ">Rechtliche Hinweise</a>"],
          [">Trasparenza IA</a>", ">KI-Transparenz</a>"]
        ]
      : [
          [">Guida allo Studio</a>", ">Studio Guide</a>"],
          [">Termini e condizioni</a>", ">Terms and conditions</a>"],
          [">Note legali</a>", ">Legal notice</a>"],
          [">Trasparenza IA</a>", ">AI transparency</a>"]
        ];
    for (const [source, target] of pairs) out = out.split(source).join(target);
    return out;
  });
}

function localizedPrivatePage(pathname) {
  return /^\/(?:de|en)\/(?:studio|account(?:\/|$)|libro\/)/.test(pathname);
}

function deletePanelPage(pathname) {
  return /^\/(?:de|en)\/(?:studio|libro\/)/.test(pathname) && !/\/anteprima$/.test(pathname);
}

async function fetchEditorDeleteCopy(request, env, ctx) {
  const response = await notFoundWorker.fetch(request, env, ctx);
  const url = new URL(request.url);
  const locale = localeFromPath(url.pathname);
  if (!locale || request.method !== "GET" || !localizedPrivatePage(url.pathname) || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;

  let html = await response.text();
  html = localizePrivateFooter(html, locale);
  if (deletePanelPage(url.pathname)) html = localizeClientDeletePanel(html, locale);

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchEditorDeleteCopy,
  email(message, env, ctx) { return notFoundWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return notFoundWorker.scheduled(controller, env, ctx); }
};
