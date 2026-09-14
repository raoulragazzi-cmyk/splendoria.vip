import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/studio-worker.js';
let source = readFileSync(path, 'utf8');

const importAnchor = 'import baseWorker from "./worker.js";\n';
const showcaseImport = 'import { enhanceItalianShowcaseHtml, localizeShowcaseHtml, localizedShowcaseRoute, rewriteLocalizedContactResponse, toBaseShowcaseRequest } from "./i18n-showcase.js";\n';
const selectorImport = 'import { ensureShowcaseSelector } from "./i18n-selector.js";\n';
const publicImport = 'import { enhanceItalianPublicHtml, localizedPublicRoute, localizePublicHtml, toBasePublicRequest } from "./i18n-public.js";\n';

if (!source.includes(showcaseImport)) {
  if (source.split(importAnchor).length - 1 !== 1) throw new Error('Unexpected baseWorker import anchor');
  source = source.replace(importAnchor, importAnchor + showcaseImport);
}
if (!source.includes(selectorImport)) {
  if (source.split(showcaseImport).length - 1 !== 1) throw new Error('Unexpected showcase import anchor');
  source = source.replace(showcaseImport, showcaseImport + selectorImport);
}
if (!source.includes(publicImport)) {
  if (source.split(selectorImport).length - 1 !== 1) throw new Error('Unexpected selector import anchor');
  source = source.replace(selectorImport, selectorImport + publicImport);
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
const localizedPublicBlock = `${typeAnchor}\n  if (publicRoute && contentType.includes('text/html')) {\n    const html = await response.text();\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    headers.set('cache-control', 'no-cache');\n    return new Response(localizePublicHtml(html, publicRoute), { status: response.status, statusText: response.statusText, headers });\n  }\n`;
if (!source.includes("if (publicRoute && contentType.includes('text/html'))")) {
  if (source.split(typeAnchor).length - 1 !== 1) throw new Error('Unexpected content-type anchor');
  source = source.replace(typeAnchor, localizedPublicBlock);
}

const italianGuideBlock = `\n  if (url.pathname === '/guida' && contentType.includes('text/html')) {\n    const html = await response.text();\n    const headers = new Headers(response.headers);\n    headers.delete('content-length');\n    return new Response(enhanceItalianPublicHtml(html, url.pathname), { status: response.status, statusText: response.statusText, headers });\n  }\n`;
const privacyAnchor = "\n\n  if ((url.pathname === '/privacy-policy' || url.pathname === '/cookie-policy') && contentType.includes('text/html')) {";
if (!source.includes("url.pathname === '/guida' && contentType.includes('text/html')")) {
  if (source.split(privacyAnchor).length - 1 !== 1) throw new Error('Unexpected privacy branch anchor');
  source = source.replace(privacyAnchor, italianGuideBlock + privacyAnchor);
}

writeFileSync(path, source, 'utf8');
console.log('Showcase and public guide i18n routing wired safely');
