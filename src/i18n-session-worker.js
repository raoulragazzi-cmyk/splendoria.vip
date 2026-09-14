import clientWorker from "./i18n-client-worker.js";

function localizedLocale(pathname) {
  const match = pathname.match(/^\/(de|en)(?:\/|$)/);
  return match?.[1] || "";
}

function localizeClientActions(html, locale) {
  return String(html || "")
    .split('action="/esci"').join(`action="/${locale}/esci"`)
    .split('href="/account/esporta.json"').join(`href="/${locale}/account/esporta.json"`);
}

function translateLogoutMessage(value, locale) {
  const source = "Sei uscito dal tuo Studio. Puoi rientrare con le stesse credenziali.";
  if (value !== source) return value;
  return locale === "de"
    ? "Du hast dein Studio verlassen. Du kannst dich mit denselben Zugangsdaten erneut anmelden."
    : "You have signed out of your Studio. You can sign in again with the same credentials.";
}

function localizeRedirect(response, locale) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;
  let target;
  try { target = new URL(location, "https://www.splendoria.vip"); } catch { return response; }
  if (target.pathname !== "/area-clienti") return response;
  target.pathname = `/${locale}/area-clienti`;
  const message = target.searchParams.get("e");
  if (message) target.searchParams.set("e", translateLogoutMessage(message, locale));
  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function fetchSession(request, env, ctx) {
  const url = new URL(request.url);
  const logout = url.pathname.match(/^\/(de|en)\/esci$/);
  if (logout) {
    const internalUrl = new URL(request.url);
    internalUrl.pathname = "/esci";
    const response = await clientWorker.fetch(new Request(internalUrl.toString(), request), env, ctx);
    return localizeRedirect(response, logout[1]);
  }

  const response = await clientWorker.fetch(request, env, ctx);
  const locale = localizedLocale(url.pathname);
  if (!locale || request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(localizeClientActions(await response.text(), locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchSession,
  email(message, env, ctx) { return clientWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return clientWorker.scheduled(controller, env, ctx); }
};
