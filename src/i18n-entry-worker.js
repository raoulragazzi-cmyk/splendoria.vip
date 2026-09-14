import legalWorker from "./i18n-legal-worker.js";

const LOCALIZED_PUBLIC = new Set([
  "/", "/guida", "/privacy-policy", "/cookie-policy", "/termini-condizioni", "/note-legali", "/trasparenza-ai"
]);

function routeLocale(pathname) {
  const match = pathname.match(/^\/(de|en)(\/.*)$/);
  return match ? { locale: match[1], basePath: match[2] || "/" } : null;
}

function keepPublicLinksInLocale(html, locale) {
  const prefix = `/${locale}`;
  let out = html.replace(/href="\/(guida|privacy-policy|cookie-policy|termini-condizioni|note-legali|trasparenza-ai)"/g, `href="${prefix}/$1"`);
  out = out.replace(/href="\/\#(metodo|formule|contatti)"/g, `href="${prefix}/#$1"`);
  return out;
}

function polishLegalLabels(html, locale, basePath) {
  let out = html;
  if (locale === "de") {
    out = out.split("Partita IVA").join("USt-IdNr.");
    out = out.split("Email:").join("E-Mail:");
    if (basePath === "/privacy-policy") out = out.split("Privacy Policy").join("Datenschutzerklärung");
  } else {
    out = out.split("Partita IVA").join("VAT number");
  }
  return out;
}

async function fetchEntry(request, env, ctx) {
  const response = await legalWorker.fetch(request, env, ctx);
  if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const route = routeLocale(new URL(request.url).pathname);
  if (!route || !LOCALIZED_PUBLIC.has(route.basePath)) return response;
  let html = await response.text();
  html = keepPublicLinksInLocale(html, route.locale);
  html = polishLegalLabels(html, route.locale, route.basePath);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  fetch: fetchEntry,
  email(message, env, ctx) { return legalWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return legalWorker.scheduled(controller, env, ctx); }
};
