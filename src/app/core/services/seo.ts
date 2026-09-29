import { DOCUMENT } from '@angular/common';
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
 *
 * The backend is the single source of truth for ALL SEO: entity-detail endpoints
 * return `seo` next to `data`, and static/listing pages get theirs from
 * GET /page-seo/:page (see core/resolvers/page-seo-resolver.ts). Nothing is
 * hardcoded on the frontend.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private titleService = inject(Title);
  private meta = inject(Meta);
  // Angular's injected DOCUMENT works during SSR too; the global `document` does NOT exist
  // in the server runtime (so canonical + JSON-LD were silently skipped there before).
  private doc = inject(DOCUMENT);

  apply(seo: SeoData): void {
    this.titleService.setTitle(seo.title);

    this.setTag('name', 'description', seo.description);
    this.setTag('name', 'robots', seo.robots);
    if (seo.meta?.keywords) this.setTag('name', 'keywords', seo.meta.keywords);

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
    if (!url) return;
    let link = this.doc.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(jsonLd: SeoData['jsonLd'] | undefined): void {
    this.doc.head.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    entries.forEach((entry) => {
      if (!entry) return;
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '');
      script.text = JSON.stringify(entry);
      this.doc.head.appendChild(script);
    });
  }
}
