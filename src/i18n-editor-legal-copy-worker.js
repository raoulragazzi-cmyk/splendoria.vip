import uiRuntimeWorker from "./i18n-ui-runtime-worker.js";

const LOCALES = new Set(["de", "en"]);

function pathLocale(pathname) {
  return pathname.match(/^\/(de|en)(?:\/|$)/)?.[1] || "";
}

export function localizeEditorConsent(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");
  return String(html || "").replace(
    /<span>Confermo di poter condividere i contenuti inseriti e, se comprendono dati particolari che mi riguardano, presto il consenso esplicito al loro trattamento per realizzare il libro\. Per eventuali dati di terzi dichiaro di averne titolo\. <a href="\/(?:de|en)\/privacy-policy" target="_blank" rel="noopener">Approfondisci<\/a>\.<\/span>/g,
    locale === "de"
      ? '<span>Ich bestätige, dass ich die eingegebenen Inhalte teilen darf, und willige ausdrücklich in die Verarbeitung ein, sofern sie besondere Kategorien personenbezogener Daten über mich enthalten und dies zur Erstellung des Buches erforderlich ist. Für Daten Dritter bestätige ich, dass ich zu ihrer Verwendung berechtigt bin. <a href="/de/privacy-policy" target="_blank" rel="noopener">Mehr erfahren</a>.</span>'
      : '<span>I confirm that I am entitled to share the content entered and, where it contains special-category personal data about me, I explicitly consent to its processing for the purpose of creating the book. For any third-party data, I confirm that I am entitled to use it. <a href="/en/privacy-policy" target="_blank" rel="noopener">Learn more</a>.</span>'
  );
}

async function fetchEditorLegalCopy(request, env, ctx) {
  const response = await uiRuntimeWorker.fetch(request, env, ctx);
  const url = new URL(request.url);
  const locale = pathLocale(url.pathname);
  if (!locale || request.method !== "GET" || !/^\/(?:de|en)\/libro\//.test(url.pathname) || /\/anteprima$/.test(url.pathname) || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(localizeEditorConsent(await response.text(), locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchEditorLegalCopy,
  email(message, env, ctx) { return uiRuntimeWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return uiRuntimeWorker.scheduled(controller, env, ctx); }
};
