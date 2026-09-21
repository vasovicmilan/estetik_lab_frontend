// Mirrors the backend's testimonial.mapper.js. A Testimonial is a customer
// review submitted publicly - permission `manage_marketing`, NOT module-gated.
// Admin only reviews (approve/reject/feature), never creates or edits the
// content itself, so there is no edit payload shape here, only:
//
// 1. TestimonialAdminListItem - GET /admin/testimonials        (mapTestimonialsForAdminList)
// 2. TestimonialAdminDetail    - GET /admin/testimonials/:id    (mapTestimonialForAdminDetail)

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

interface TestimonialImage {
  url: string;
  alt?: string;
}

interface TestimonialRef {
  id: string;
  naziv?: string;
  slug?: string;
}

// ---- (1) Admin list row ----

export interface TestimonialAdminListItem {
  id: string;
  ime: string;
  slika: TestimonialImage | null;
  email: string;
  /** Star string, e.g. "★★★★☆". */
  ocena: string;
  ocenaRaw: number;
  /** Truncated to 100 chars. */
  komentar: string;
  /** Name of the linked service/package/product, or "". */
  usluga: string;
  status: string;
  statusRaw: TestimonialStatus;
  /** "Da" | "NE" (GDPR consent). */
  saglasnost: string;
  /** "Da" | "Ne". */
  istaknut: string;
  kreiran: string;
}

// ---- (2) Admin detail ----

export interface TestimonialAdminDetail {
  id: string;
  osnovno: {
    ime: string;
    email: string;
    slika: TestimonialImage | null;
    ocena: number;
    ocenaZvezdice: string;
    komentar: string;
  };
  usluga: TestimonialRef | null;
  paket: TestimonialRef | null;
  proizvod: TestimonialRef | null;
  /** Set only if submitted by a logged-in registered user. */
  korisnik: { userId: string; ime: string } | null;
  status: {
    vrednost: string;
    vrednostRaw: TestimonialStatus;
    istaknut: boolean;
    redosled: number;
  };
  saglasnost: { data: boolean; kada: string | null; ip: string | null };
  vreme: { kreirano: string; azurirano: string };
}
