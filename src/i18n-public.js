import { GUIDE_PATHS, localizeGuideHtml } from './i18n-guide.js';
import { LEGAL_PAGES } from './i18n-legal.js';
import { addReciprocalHreflang, baseRequestFor } from './i18n-page-utils.js';
import { ensureShowcaseSelector } from './i18n-selector.js';

const PAGES = [
  { key: 'guide', basePath: GUIDE_PATHS.it, paths: GUIDE_PATHS, localize: localizeGuideHtml },
  ...LEGAL_PAGES
];

const HOME_PATHS = { it: '/', de: '/de/', en: '/en/' };
const CANONICAL_ORIGIN = 'https://www.splendoria.vip';

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function localizedPublicRoute(url) {
  const pathname = normalizePath(url.pathname);
  for (const page of PAGES) {
    for (const locale of ['de', 'en']) {
      if (pathname === normalizePath(page.paths[locale])) return { ...page, locale };
    }
  }
  return null;
}

export function toBasePublicRequest(request, route) {
  return baseRequestFor(request, route.basePath);
}

export function localizePublicHtml(html, route) {
  const localized = route.localize(html, route.locale);
  return ensureShowcaseSelector(localized, route.locale, route.paths);
}

export function enhanceItalianPublicHtml(html, pathname) {
  const normalized = normalizePath(pathname);
  const page = PAGES.find(item => normalizePath(item.basePath) === normalized);
  if (!page) return html;
  const withAlternates = addReciprocalHreflang(html, page.paths);
  return ensureShowcaseSelector(withAlternates, 'it', page.paths);
}

export function publicPagePaths(pathname) {
  const normalized = normalizePath(pathname);
  const page = PAGES.find(item => normalizePath(item.basePath) === normalized || Object.values(item.paths).some(path => normalizePath(path) === normalized));
  return page?.paths || null;
}

export function italianPublicPath(pathname) {
  const normalized = normalizePath(pathname);
  return PAGES.some(page => normalizePath(page.basePath) === normalized);
}

export function translatedPublicUrls() {
  const paths = [HOME_PATHS, ...PAGES.map(page => page.paths)];
  return paths.flatMap(group => ['de', 'en'].map(locale => `${CANONICAL_ORIGIN}${group[locale]}`));
}

export function augmentPublicSitemap(xml) {
  if (!String(xml).includes('</urlset>')) return xml;
  const existing = String(xml);
  const additions = translatedPublicUrls()
    .filter(url => !existing.includes(`<loc>${url}</loc>`))
    .map(url => `  <url>\n    <loc>${url}</loc>\n    <lastmod>2026-09-14</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url.endsWith('/de/') || url.endsWith('/en/') ? '0.9' : '0.5'}</priority>\n  </url>`)
    .join('\n');
  if (!additions) return existing;
  return existing.replace('</urlset>', `${additions}\n</urlset>`);
}
