import appWorker from "./german-editorial-room-worker.js";

const STUDIO_SCRIPT_PATH = "/assets/studio.js";

function withStudioScriptCachePolicy(request, response) {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== STUDIO_SCRIPT_PATH || !response.ok) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("javascript")) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-cache, max-age=0, must-revalidate");
  headers.set("cdn-cache-control", "no-cache, max-age=0, must-revalidate");
  headers.set("x-splendoria-studio-cache-policy", "revalidate");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const response = await appWorker.fetch(request, env, ctx);
    return withStudioScriptCachePolicy(request, response);
  },
  email(message, env, ctx) {
    return appWorker.email(message, env, ctx);
  },
  scheduled(controller, env, ctx) {
    return appWorker.scheduled(controller, env, ctx);
  }
};

export { withStudioScriptCachePolicy };
