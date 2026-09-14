const ORIGIN = 'https://www.splendoria.vip';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyTextMap(html, entries) {
  for (const [source, target] of entries) {
    const re = new RegExp(`>(\\s*)${escapeRegExp(source)}(\\s*)<`, 'g');
    html = html.replace(re, (_m, before, after) => `>${before}${target}${after}<`);
  }
  return html;
}

export function applyAttributeMap(html, entries) {
  for (const [source, target] of entries) {
    for (const attr of ['alt', 'aria-label', 'placeholder', 'title']) {
      const re = new RegExp(`(${attr}=["'])${escapeRegExp(source)}(["'])`, 'g');
      html = html.replace(re, `$1${target}$2`);
    }
  }
  return html;
}

export function rewriteExactHrefs(html, hrefMap) {
  for (const [source, target] of Object.entries(hrefMap || {})) {
    const re = new RegExp(`href=(["'])${escapeRegExp(source)}\\1`, 'g');
    html = html.replace(re, (_m, quote) => `href=${quote}${target}${quote}`);
  }
  return html;
}

export function addReciprocalHreflang(html, paths) {
  if (html.includes('hreflang="x-default"')) return html;
  const alternates = ['it', 'de', 'en'].map(code => `<link rel="alternate" hreflang="${code}" href="${ORIGIN}${paths[code]}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${paths.it}">`;
  const canonicalTag = html.match(/<link rel="canonical" href="[^"]+">/i)?.[0];
  return canonicalTag ? html.replace(canonicalTag, `${canonicalTag}${alternates}`) : html.replace('</head>', `${alternates}</head>`);
}

export function localizePublicSeo(html, locale, meta, paths) {
  const canonical = `${ORIGIN}${paths[locale]}`;
  const ogLocale = locale === 'de' ? 'de_DE' : locale === 'en' ? 'en_GB' : 'it_IT';
  html = html.replace(/<html\s+lang=["'][^"']+["']>/i, `<html lang="${locale}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/i, `$1${meta.description}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(">)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(">)/i, `$1${ogLocale}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/i, `$1${meta.title}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/i, `$1${meta.description}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(">)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(">)/i, `$1${meta.title}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(">)/i, `$1${meta.description}$2`);
  return addReciprocalHreflang(html, paths);
}

export function publicRoute(pathname, routes) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const [locale, route] of Object.entries(routes)) {
    if (normalized === route) return { locale, canonicalPath: route };
  }
  return null;
}

export function baseRequestFor(request, basePath) {
  const url = new URL(request.url);
  url.pathname = basePath;
  return new Request(url.toString(), { method: request.method, headers: new Headers(request.headers), redirect: request.redirect });
}
