// Mirrors the backend's newsletter-subscriber.mapper.js. A Subscriber is a
// public-facing newsletter sign-up - permission `manage_marketing`, NOT
// module-gated. Unlike Category/BusinessPartner/Coupon, there is no admin
// edit payload shape here: subscribers sign themselves up publicly and
// unsubscribe themselves, admin can only view and delete (e.g. a GDPR removal
// request), so this model has the two admin read shapes:
//
// 1. SubscriberAdminListItem - GET /admin/newsletter-subscribers        (mapSubscribersForAdminList)
// 2. SubscriberAdminDetail    - GET /admin/newsletter-subscribers/:id    (mapSubscriberForAdminDetail)
//
// Plus the public write shape below - POST /newsletter-subscribe
// (public-forms.routes.js, unauthenticated, gated by newsletterLimiter +
// honeypot), mirroring validateNewsletterSubscribe (newsletter.validator.js).

export type SubscriberStatus = 'subscribed' | 'unsubscribed';

// ---- (1) Admin list row ----

export interface SubscriberAdminListItem {
  id: string;
  email: string;
  /** "Prijavljen" | "Odjavljen". */
  status: string;
  statusRaw: SubscriberStatus;
  /** Serbian labels, e.g. ["Opšte", "Proizvodi"]. */
  interesovanja: string[];
  prijavljen: string;
}

// ---- (2) Admin detail (read-only) ----

export interface SubscriberAdminDetail {
  id: string;
  osnovno: {
    email: string;
    status: string;
    statusRaw: SubscriberStatus;
    interesovanja: string[];
  };
  vreme: {
    prijavljen: string;
    odjavljen: string | null;
    kreirano: string;
    azurirano: string;
  };
}

// ---- Public write shape - POST /newsletter-subscribe ----

export type NewsletterInterest = 'general' | 'products' | 'partnership';

export interface SubscriberSubmitPayload {
  email: string;
  /** Literal string "true" required - express-validator's .equals("true")
   * checks the raw (pre-boolean-coercion) body value, see
   * newsletter.validator.js's own comment on this field. */
  consent: 'true';
  interests?: NewsletterInterest[];
}
