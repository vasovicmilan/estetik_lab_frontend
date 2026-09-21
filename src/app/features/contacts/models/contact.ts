// Mirrors the backend's contact.mapper.js. A Contact is a public contact-form
// submission - permission `manage_marketing`, NOT module-gated. Admin only
// reviews and moves it through a status workflow; there is no create/edit and
// no delete endpoint on the admin side, only:
//
// 1. ContactAdminListItem - GET /admin/contacts        (mapContactsForAdminList)
// 2. ContactAdminDetail    - GET /admin/contacts/:id    (mapContactForAdminDetail)
//
// Plus the public write shape below - POST /contact (public-forms.routes.js,
// unauthenticated, gated by contactLimiter + honeypot), mirroring
// validateContactCreate (contact.validator.js) exactly.

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

// ---- (1) Admin list row ----

export interface ContactAdminListItem {
  id: string;
  imePrezime: string;
  email: string;
  tema: string | null;
  status: string;
  statusRaw: ContactStatus;
  datum: string;
}

// ---- (2) Admin detail ----

export interface ContactAdminDetail {
  id: string;
  osnovno: {
    ime: string;
    prezime: string;
    email: string;
    telefon: string | null;
    tema: string | null;
    status: string;
    statusRaw: ContactStatus;
    saglasnost: string;
  };
  /** The full message. */
  poruka: string;
  referalniKod: string | null;
  vreme: { kreirano: string; azurirano: string };
}

// ---- Public write shape - POST /contact ----

export interface ContactSubmitPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
  /** Server accepts boolean true/'true'/'on' - Angular always sends boolean true. */
  consent: boolean;
}
