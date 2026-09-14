import publicWorker from "./i18n-public-worker.js";

const LAST_PARAGRAPH_IT = "Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»";
const LAST_PARAGRAPH = {
  de: "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»",
  en: "She had already been at the stove for hours. When we arrived, the house was full of aromas: the sauce simmering slowly, the meat…”"
};

async function fetchRelease(request, env, ctx) {
  const response = await publicWorker.fetch(request, env, ctx);
  if (request.method !== "GET" || !response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return response;
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/(de|en)\/$/);
  if (!match) return response;
  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html.split(LAST_PARAGRAPH_IT).join(LAST_PARAGRAPH[match[1]]), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchRelease,
  email(message, env, ctx) { return publicWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return publicWorker.scheduled(controller, env, ctx); }
};
