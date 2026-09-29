import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import {
  AboutContent,
  FaqContent,
  LegalPageContent,
  PartnershipContent,
  HomeIntroContent,
  TeamIntroContent,
  ListIntroContent,
  HomePageContent,
  ContactPageContent,
  PublicTestimonial,
} from '../models/site-content';

/**
 * Thin read-only wrapper around the DB-backed site content endpoints (see
 * core/models/site-content.ts's header comment). One method per public page -
 * mirrors the backend's one-endpoint-per-page split (site-content.service.js),
 * so a page only fetches the copy it actually needs.
 */
@Injectable({ providedIn: 'root' })
export class SiteContent {
  private api = inject(Api);

  getAbout(): Observable<AboutContent> {
    return this.api.get<AboutContent>('about');
  }

  getFaq(): Observable<FaqContent> {
    return this.api.get<FaqContent>('faq');
  }

  getPrivacyPolicy(): Observable<LegalPageContent> {
    return this.api.get<LegalPageContent>('privacy-policy');
  }

  getTerms(): Observable<LegalPageContent> {
    return this.api.get<LegalPageContent>('terms');
  }

  getPartnershipProgram(): Observable<PartnershipContent> {
    return this.api.get<PartnershipContent>('partnership-program');
  }

  getHomeIntro(): Observable<HomeIntroContent> {
    return this.api.get<HomeIntroContent>('home-intro');
  }

  getTeamIntro(): Observable<TeamIntroContent> {
    return this.api.get<TeamIntroContent>('team/intro');
  }

  /** page: services | packages | products | blog */
  getListIntro(page: 'services' | 'packages' | 'products' | 'blog'): Observable<ListIntroContent> {
    return this.api.get<ListIntroContent>(`list-intro/${page}`);
  }

  getHomePage(): Observable<HomePageContent> {
    return this.api.get<HomePageContent>('home');
  }

  getContactPage(): Observable<ContactPageContent> {
    return this.api.get<ContactPageContent>('contact-page');
  }

  getTestimonials(limit = 6): Observable<PublicTestimonial[]> {
    return this.api.get<PublicTestimonial[]>('testimonials', { limit });
  }
}
