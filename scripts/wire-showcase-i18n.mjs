import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/studio-worker.js';
let source = readFileSync(path, 'utf8');

const importAnchor = 'import baseWorker from "./worker.js";\n';
const showcaseImport = 'import { enhanceItalianShowcaseHtml, localizeShowcaseHtml, localizedShowcaseRoute, rewriteLocalizedContactResponse, toBaseShowcaseRequest } from "./i18n-showcase.js";\n';
const selectorImport = 'import { ensureShowcaseSelector } from "./i18n-selector.js";\n';
const oldPublicImport = 'import { enhanceItalianPublicHtml, localizedPublicRoute, localizePublicHtml, toBasePublicRequest } from "./i18n-public.js";\n';
const publicImport = 'import { augmentPublicSitemap, enhanceItalianPublicHtml, italianPublicPath, localizedPublicRoute, localizePublicHtml, toBasePublicRequest } from "./i18n-public.js";\n';

if (!source.includes(showcaseImport)) {
  if (source.split(importAnchor).length - 1 !== 1) throw new Error('Unexpected baseWorker import anchor');
  source = source.replace(importAnchor, importAnchor + showcaseImport);
}
if (!source.includes(selectorImport)) {
  if (source.split(showcaseImport).length - 1 !== 1) throw new Error('Unexpected showcase import anchor');
  source = source.replace(showcaseImport, showcaseImport + selectorImport);
}
if (!source.includes(publicImport)) {
  if (source.includes(oldPublicImport)) source = source.replace(oldPublicImport, publicImport);
  else {
    if (source.split(selectorImport).length - 1 !== 1) throw new Error('Unexpected selector import anchor');
    source = source.replace(selectorImport, selectorImport + publicImport);
  }
}

const routeAnchor = "  const showcaseRoute = localizedShowcaseRoute(url);\n";
const routeWithPublic = routeAnchor + "  const publicRoute = localizedPublicRoute(url);\n";
if (!source.includes(routeWithPublic)) {
  if (source.split(routeAnchor).length - 1 !== 1) throw new Error('Unexpected showcase route anchor');
  source = source.replace(routeAnchor, routeWithPublic);
}

const upstreamOld = "  const upstreamRequest = showcaseRoute ? toBaseShowcaseRequest(request, showcaseRoute) : request;\n";
const upstreamNew = "  const upstreamRequest = publicRoute ? toBasePublicRequest(request, publicRoute) : showcaseRoute ? toBaseShowcaseRequest(request, showcaseRoute) : request;\n";
if (!source.includes(upstreamNew)) {
  if (source.split(upstreamOld).length - 1 !== 1) throw new Error('Unexpected upstream request anchor');
  source = source.replace(upstreamOld, upstreamNew);
}

const typeAnchor = "  const contentType = response.headers.get('content-type') || '';\n";
const sitemapBlock = `${typeAnchor}\n  if (url.pathname === '/sitemap.xml' && response.ok) {\n    const xml = await response.text();\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    return new Response(augmentPublicSitemap(xml), { status: response.status, statusText: response.statusText, headers });\n  }\n`;
if (!source.includes("url.pathname === '/sitemap.xml' && response.ok")) {
  if (source.split(typeAnchor).length - 1 !== 1) throw new Error('Unexpected content-type anchor for sitemap');
  source = source.replace(typeAnchor, sitemapBlock);
}

const publicBlockAnchor = "  if (publicRoute && contentType.includes('text/html')) {\n";
if (!source.includes(publicBlockAnchor)) {
  const anchor = "  if (showcaseRoute?.kind === 'home' && contentType.includes('text/html')) {\n";
  if (source.split(anchor).length - 1 !== 1) throw new Error('Unexpected localized public insertion anchor');
  const block = `  if (publicRoute && contentType.includes('text/html')) {\n    const html = await response.text();\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    headers.set('cache-control', 'no-cache');\n    return new Response(localizePublicHtml(html, publicRoute), { status: response.status, statusText: response.statusText, headers });\n  }\n\n`;
  source = source.replace(anchor, block + anchor);
}

const guideOnly = `  if (url.pathname === '/guida' && contentType.includes('text/html')) {\n    const html = await response.text();\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    return new Response(enhanceItalianPublicHtml(html, url.pathname), { status: response.status, statusText: response.statusText, headers });\n  }\n`;
const italianPublic = `  if (italianPublicPath(url.pathname) && contentType.includes('text/html')) {\n    let html = await response.text();\n    if (url.pathname === '/privacy-policy' || url.pathname === '/cookie-policy') html = splPatchPrivacyCenterPage(html, url.pathname);\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    headers.set('cache-control', 'no-cache');\n    return new Response(enhanceItalianPublicHtml(html, url.pathname), { status: response.status, statusText: response.statusText, headers });\n  }\n`;
if (!source.includes(italianPublic)) {
  if (source.includes(guideOnly)) source = source.replace(guideOnly, italianPublic);
  else throw new Error('Italian public-page anchor not found');
}

writeFileSync(path, source, 'utf8');
console.log('Showcase, guide, legal pages and sitemap i18n routing wired safely');
