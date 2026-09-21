import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoData } from '../models/api-response';

/**
 * Applies the `seo` object an entity-detail API response already carries (see
 * catalog.controller.js's generateSeo() calls) to the document - Title/Meta run on
 * the server during SSR too, so this is what actually gets crawled, not just what
 * shows in a browser tab. Called from a route resolver (see
 * features/services-catalog/resolvers/service-detail-resolver.ts) so the tags are
 * set before the page is sent to the client, not after an initial render.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private titleService = inject(Title);
  private meta = inject(Meta);

  apply(seo: SeoData): void {
    this.titleService.setTitle(seo.title);

    this.setTag('name', 'description', seo.description);
    this.setTag('name', 'robots', seo.robots);
    if (seo.meta.keywords) this.setTag('name', 'keywords', seo.meta.keywords);

    this.setTag('property', 'og:title', seo.og.title);
    this.setTag('property', 'og:description', seo.og.description);
    this.setTag('property', 'og:url', seo.og.url);
    this.setTag('property', 'og:type', seo.og.type);
    if (seo.og.image) this.setTag('property', 'og:image', seo.og.image);

    this.setTag('name', 'twitter:card', seo.twitter.card);
    this.setTag('name', 'twitter:title', seo.twitter.title);
    this.setTag('name', 'twitter:description', seo.twitter.description);
    if (seo.twitter.image) this.setTag('name', 'twitter:image', seo.twitter.image);

    this.setCanonical(seo.canonical);
    this.setJsonLd(seo.jsonLd);
  }

  private setTag(attr: 'name' | 'property', key: string, content?: string): void {
    if (!content) return;
    this.meta.updateTag({ [attr]: key, content });
  }

  private setCanonical(url: string): void {
    // Meta service has no canonical-link helper - it's a <link>, not a <meta> tag.
    if (typeof document === 'undefined') return; // SSR: document exists too (domino), guard kept for clarity
    let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(jsonLd: SeoData['jsonLd']): void {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    entries.forEach((entry) => {
      if (!entry) return;
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '');
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }
}
