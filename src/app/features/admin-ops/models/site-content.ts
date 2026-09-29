// Mirrors siteContentService's shapes exactly (GET/PUT /admin/site-content -
// see admin-ops.controller.js's getSiteContent/updateXxx family, and
// site-content.service.js's own getSiteContent()). Permission
// `manage_site_content` (same as site-settings - see site-content.routes'
// header comment on the backend for why this is a SEPARATE singleton from
// SiteSettings rather than more fields on it: this one carries the
// marketing/legal COPY, not operational config).
//
// `ContentSection`/`ContentSubsection` are reused as-is from the PUBLIC
// content model (core/models/site-content.ts) - About/Privacy/Terms share the
// exact same nested shape whether read publicly or edited here, and the
// backend's own light validation (requireSections - see site-content.service.js)
// only checks that each section has a non-empty `title`, so this admin screen
// edits the rest of each section (paragraphs/list/closingParagraphs/subsections)
// as raw JSON rather than a deep recursive form - see the form component's
// header comment for the reasoning.
import { ContentSection } from '../../../core/models/site-content';

export interface SiteContentFaqItem {
  pitanje: string;
  odgovor: string;
}

export interface SiteContentPartnershipStep {
  number: number;
  title: string;
  description: string;
}

export interface SiteContentHomeMassage {
  title: string;
  text: string;
  href: string;
}

export interface SiteContentWhyUsItem {
  icon: string;
  title: string;
  text: string;
}

export interface SiteContentAbout {
  intro: string;
  sections: ContentSection[];
}

export interface SiteContentFaq {
  items: SiteContentFaqItem[];
}

/** Privacy Policy and Terms & Conditions share this exact shape. */
export interface SiteContentLegalPage {
  lastUpdated: string;
  intro: string;
  sections: ContentSection[];
}

export interface SiteContentPartnership {
  intro: string;
  steps: SiteContentPartnershipStep[];
  highlights: string[];
}

/** Admin edit shape does NOT include `whyUs` (unlike the public /home-intro
 * response, which merges homeIntro+whyUs for the home page's convenience) -
 * "Zašto mi" is its own section here with its own PUT endpoint
 * (`/site-content/zasto-mi`), matching the backend's own separate
 * updateHomeIntro()/updateWhyUs() functions. */
export interface SiteContentHomeIntro {
  title: string;
  lead: string;
  who: string;
  massages: SiteContentHomeMassage[];
  packages: string;
  closing: string;
}

export interface SiteContentTeamIntro {
  eyebrow: string;
  title: string;
  lead: string;
  highlights: SiteContentWhyUsItem[];
}

/** One static/listing page's SEO. `label`/`path` are read-only (defined in backend code,
 * not stored) so this UI never keeps its own list of pages. */
export interface SiteContentPageSeoEntry {
  label: string;
  path: string;
  title: string;
  description: string;
  noIndex: boolean;
}

export type SiteContentPageSeo = Record<string, SiteContentPageSeoEntry>;

/** GET /admin/site-content response - everything in one call, same reasoning
 * as SiteSettings's getSiteSettingsForEdit(). */
export interface SiteContentAll {
  about: SiteContentAbout;
  faq: SiteContentFaq;
  privacyPolicy: SiteContentLegalPage;
  termsAndConditions: SiteContentLegalPage;
  partnership: SiteContentPartnership;
  homeIntro: SiteContentHomeIntro;
  whyUs: SiteContentWhyUsItem[];
  teamIntro: SiteContentTeamIntro;
  pageSeo: SiteContentPageSeo;
}
