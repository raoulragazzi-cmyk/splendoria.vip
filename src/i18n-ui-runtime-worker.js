import editorCopyWorker from "./i18n-editor-copy-worker.js";
import { buildGermanDictationCandidate } from "./studio-dictation-de-ux.js";

const LOCALES = new Set(["de", "en"]);

export function bindUiMessagesToLocale(source, locale) {
  let out = String(source || "");
  if (!LOCALES.has(locale)) return out;
  const uiMessageLocale = locale === "de" ? "de-DE" : "en-GB";
  const dynamicResolver = "const message = key => (languageMessages[selectedLanguage()] || languageMessages['it-IT'])[key];";
  const fixedResolver = `const message = key => (languageMessages['${uiMessageLocale}'] || languageMessages['it-IT'])[key];`;
  return out.split(dynamicResolver).join(fixedResolver);
}

async function fetchUiRuntime(request, env, ctx) {
  const response = await editorCopyWorker.fetch(request, env, ctx);
  const url = new URL(request.url);
  const locale = url.searchParams.get("lang") || "";
  if (request.method !== "GET" || url.pathname !== "/assets/studio.js" || !LOCALES.has(locale) || !response.ok || !(response.headers.get("content-type") || "").includes("javascript")) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  const localized = bindUiMessagesToLocale(await response.text(), locale);
  const candidate = buildGermanDictationCandidate(localized, locale);
  if (locale === "de") headers.set("x-spl-dictation-ux", candidate.applied ? "de-v2" : "baseline");
  return new Response(candidate.source, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchUiRuntime,
  email(message, env, ctx) { return editorCopyWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return editorCopyWorker.scheduled(controller, env, ctx); }
};
