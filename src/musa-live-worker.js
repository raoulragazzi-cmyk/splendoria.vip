import base from './german-editorial-room-worker.js';
import {musaLiveEnabled, musaLivePage, musaLivePolicy} from './musa-live.js';

// Use the canonical admin route to enforce its existing session/role checks.
// The established Italian application and its authentication remain unchanged.
export function createMusaWorker(delegate) {
  return {
    ...delegate,
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (request.method !== 'GET' || !musaLiveEnabled(env) || !['/admin', '/admin/musa-live'].includes(path)) {
        return delegate.fetch(request, env, ctx);
      }
      const adminUrl = new URL(url);
      adminUrl.pathname = '/admin';
      if (path === '/admin/musa-live') adminUrl.search = '';
      const response = await delegate.fetch(new Request(adminUrl, request), env, ctx);
      if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) return response;
      const html = await response.text();
      if (path === '/admin') {
        return new Response(html.replace('</main>', '<p class="wrap"><a class="button secondary" href="/admin/musa-live">Prova la Musa in video</a></p></main>'), {status:200, headers:response.headers});
      }
      const page = (_title, body, _user, status = 200) => new Response(
        html.replace(/<title>[\s\S]*?<\/title>/, '<title>La Musa in video — Splendoria</title>')
          .replace(/<main\b[^>]*>[\s\S]*?<\/main>/, () => `<main id="main-content">${body}</main>`),
        {status, headers:response.headers}
      );
      const result = musaLivePage(env, null, page);
      const headers = new Headers(result.headers);
      headers.set('permissions-policy', musaLivePolicy(result, url));
      return new Response(result.body, {status:result.status, headers});
    }
  };
}

export default createMusaWorker(base);
