import { GUIDE_PATHS, localizeGuideHtml } from './i18n-guide.js';
import { addReciprocalHreflang, baseRequestFor } from './i18n-page-utils.js';
import { ensureShowcaseSelector } from './i18n-selector.js';

const PAGES = [
  { key: 'guide', basePath: GUIDE_PATHS.it, paths: GUIDE_PATHS, localize: localizeGuideHtml }
];

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function localizedPublicRoute(url) {
  const pathname = normalizePath(url.pathname);
  for (const page of PAGES) {
    for (const locale of ['de', 'en']) {
      if (pathname === page.paths[locale]) return { ...page, locale };
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
  const page = PAGES.find(item => item.basePath === normalized);
  if (!page) return html;
  const withAlternates = addReciprocalHreflang(html, page.paths);
  return ensureShowcaseSelector(withAlternates, 'it', page.paths);
}

export function publicPagePaths(pathname) {
  const normalized = normalizePath(pathname);
  const page = PAGES.find(item => item.basePath === normalized || Object.values(item.paths).includes(normalized));
  return page?.paths || null;
}
