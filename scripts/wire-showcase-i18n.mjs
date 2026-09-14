import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/studio-worker.js';
let source = readFileSync(path, 'utf8');

const importAnchor = 'import baseWorker from "./worker.js";\n';
const importLine = 'import { enhanceItalianShowcaseHtml, localizeShowcaseHtml, localizedShowcaseRoute, rewriteLocalizedContactResponse, toBaseShowcaseRequest } from "./i18n-showcase.js";\n';
const selectorImport = 'import { ensureShowcaseSelector } from "./i18n-selector.js";\n';
if (!source.includes(importLine)) {
  if (source.split(importAnchor).length - 1 !== 1) throw new Error('Unexpected baseWorker import anchor');
  source = source.replace(importAnchor, importAnchor + importLine);
}
if (!source.includes(selectorImport)) {
  if (source.split(importLine).length - 1 !== 1) throw new Error('Unexpected i18n import anchor');
  source = source.replace(importLine, importLine + selectorImport);
}

const oldFetch = `async function patchedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const response = await baseWorker.fetch(request, env, ctx);
  const contentType = response.headers.get('content-type') || '';
`;

const newFetch = `async function patchedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const showcaseRoute = localizedShowcaseRoute(url);
  if (showcaseRoute?.kind === 'home' && !url.pathname.endsWith('/')) {
    const canonicalLocaleUrl = new URL(request.url);
    canonicalLocaleUrl.pathname = '/' + showcaseRoute.locale + '/';
    return Response.redirect(canonicalLocaleUrl.toString(), 308);
  }
  const upstreamRequest = showcaseRoute ? toBaseShowcaseRequest(request, showcaseRoute) : request;
  const response = await baseWorker.fetch(upstreamRequest, env, ctx);
  if (showcaseRoute?.kind === 'contact') return rewriteLocalizedContactResponse(response, showcaseRoute.locale);
  const contentType = response.headers.get('content-type') || '';

  if (showcaseRoute?.kind === 'home' && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'no-cache');
    const localizedHtml = localizeShowcaseHtml(html, showcaseRoute.locale);
    return new Response(ensureShowcaseSelector(localizedHtml, showcaseRoute.locale), { status: response.status, statusText: response.statusText, headers });
  }

  if (url.pathname === '/' && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    const enhancedHtml = enhanceItalianShowcaseHtml(html);
    return new Response(ensureShowcaseSelector(enhancedHtml, 'it'), { status: response.status, statusText: response.statusText, headers });
  }
`;

const previousWiredFetch = `async function patchedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const showcaseRoute = localizedShowcaseRoute(url);
  if (showcaseRoute?.kind === 'home' && !url.pathname.endsWith('/')) {
    const canonicalLocaleUrl = new URL(request.url);
    canonicalLocaleUrl.pathname = '/' + showcaseRoute.locale + '/';
    return Response.redirect(canonicalLocaleUrl.toString(), 308);
  }
  const upstreamRequest = showcaseRoute ? toBaseShowcaseRequest(request, showcaseRoute) : request;
  const response = await baseWorker.fetch(upstreamRequest, env, ctx);
  if (showcaseRoute?.kind === 'contact') return rewriteLocalizedContactResponse(response, showcaseRoute.locale);
  const contentType = response.headers.get('content-type') || '';

  if (showcaseRoute?.kind === 'home' && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'no-cache');
    return new Response(localizeShowcaseHtml(html, showcaseRoute.locale), { status: response.status, statusText: response.statusText, headers });
  }

  if (url.pathname === '/' && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(enhanceItalianShowcaseHtml(html), { status: response.status, statusText: response.statusText, headers });
  }
`;

if (!source.includes(newFetch)) {
  if (source.includes(previousWiredFetch)) source = source.replace(previousWiredFetch, newFetch);
  else {
    const count = source.split(oldFetch).length - 1;
    if (count !== 1) throw new Error(`Unexpected patchedFetch anchor count: ${count}`);
    source = source.replace(oldFetch, newFetch);
  }
}

writeFileSync(path, source, 'utf8');
console.log('Showcase i18n routing and selector wired safely');
