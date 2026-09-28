// Shapes for the DB-backed marketing/legal content served by GET /api/v1/about,
// /faq, /privacy-policy, /terms, /partnership-program, /home-intro, /team/intro
// (see estatic_lab's site-content.service.js). This content used to be
// hardcoded directly in Angular components (or, for these five pages, didn't
// exist on the frontend at all yet) - it's now admin-editable in the
// database, so these pages fetch and render it instead of holding their own
// copy of the words.

/** One legal/marketing content section - About, Privacy Policy and Terms all
 * share this shape. Every field but `title` is optional since a section may
 * be plain paragraphs, a plain list, or a mix, and legal pages additionally
 * nest one level of `subsections` (Privacy Policy's "Koje podatke
 * prikupljamo", Terms's "Online zakazivanje termina"). */
export interface ContentSection {
  title: string;
  paragraphs?: string[];
  list?: string[];
  closingParagraphs?: string[];
  subsections?: ContentSubsection[];
}

export interface ContentSubsection {
  title: string;
  paragraphs?: string[];
  list?: string[];
  closingParagraphs?: string[];
}

export interface AboutContent {
  intro: string;
  sections: ContentSection[];
}

export interface FaqItem {
  pitanje: string;
  odgovor: string;
}

export interface FaqContent {
  items: FaqItem[];
}

/** Privacy Policy and Terms & Conditions share this exact shape. */
export interface LegalPageContent {
  lastUpdated: string;
  intro: string;
  sections: ContentSection[];
}

export interface PartnershipStep {
  number: number;
  title: string;
  description: string;
}

export interface PartnershipContent {
  intro: string;
  steps: PartnershipStep[];
  highlights: string[];
}

export interface HomeMassage {
  title: string;
  text: string;
  href: string;
}

export interface WhyUsItem {
  icon: string;
  title: string;
  text: string;
}

export interface HomeIntroContent {
  title: string;
  lead: string;
  who: string;
  massages: HomeMassage[];
  packages: string;
  closing: string;
  whyUs: WhyUsItem[];
}

export interface TeamIntroContent {
  eyebrow: string;
  title: string;
  lead: string;
  highlights: WhyUsItem[];
}
