// Mirrors the backend's newsletter-subscriber.mapper.js. A Subscriber is a
// public-facing newsletter sign-up - permission `manage_marketing`, NOT
// module-gated. Unlike Category/BusinessPartner/Coupon, there is no edit
// payload shape here: subscribers sign themselves up publicly and unsubscribe
// themselves, admin can only view and delete (e.g. a GDPR removal request), so
// this model only has the two read shapes:
//
// 1. SubscriberAdminListItem - GET /admin/newsletter-subscribers        (mapSubscribersForAdminList)
// 2. SubscriberAdminDetail    - GET /admin/newsletter-subscribers/:id    (mapSubscriberForAdminDetail)

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
