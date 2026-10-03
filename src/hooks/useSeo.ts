import { useEffect } from 'react';

const SITE_NAME = 'Gillian Anderson Management';
const DEFAULT_DESCRIPTION =
  'The official digital presence and private access platform for Gillian Anderson — professional representation, media, appearances and fan relations.';

interface SeoOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  image?: string;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets document title, description, canonical, Open Graph and robots for a route.
 * Private routes (noindex) are kept out of search engines.
 */
export function useSeo(options: SeoOptions = {}) {
  const { title, description, canonicalPath, noindex = false, type = 'website', image } = options;
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    if (image) setMeta('meta[property="og:image"]', 'property', 'og:image', image);

    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);

    const path = canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    canonical.href = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }, [fullTitle, desc, canonicalPath, noindex, type, image]);
}

export { DEFAULT_DESCRIPTION, SITE_NAME };
