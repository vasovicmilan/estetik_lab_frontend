// Mirrors the backend's temporary-order.mapper.js. A TemporaryOrder is an
// unconfirmed checkout cart awaiting the customer's own email-confirmation link
// (or, for freight-shipped items, awaiting an admin to set the real shipping cost
// first via the `/shipping` action before the customer can confirm). Permission
// `manage_orders`, same router family as the Order feature but a genuinely
// separate, simpler flow - no edit, only "confirm on the customer's behalf" or
// "set the shipping quote".
//
// 1. TemporaryOrderAdminListItem - GET /admin/temporary-orders     (mapTemporaryOrdersForAdminList)
// 2. TemporaryOrderAdminDetail    - GET /admin/temporary-orders/:id (mapTemporaryOrderForAdminDetail)
//
// NOTE: the list item's `ukupnaCena` is a formatted STRING, but the detail's
// money fields (`subtotal`/`dostava`/`popust`/`ukupnaCena`) are RAW NUMBERS -
// that's confirmed real backend behavior, not a bug to normalize away. Render
// the detail's numbers directly (no currency pipe exists in this app yet).

// ---- (1) Admin list row ----

export interface TemporaryOrderAdminListItem {
  id: string;
  /** Full name. */
  korisnik: string;
  email: string | null;
  /** Formatted money, e.g. "3.500,00 RSD". */
  ukupnaCena: string;
  /** "Da" | "Ne". */
  zahtevaProceenuDostave: string;
  /** Formatted datetime - token expiration. */
  istice: string;
  kreirano: string;
}

// ---- (2) Admin detail ----

export interface TemporaryOrderAdminAddress {
  grad: string;
  postanskiBroj: string;
  ulica: string;
  broj: string;
}

export interface TemporaryOrderAdminLineItem {
  productId?: string;
  variantId?: string;
  naziv: string;
  varijanta?: string;
  sku: string | null;
  cena: number;
  kolicina: number;
}

export interface TemporaryOrderAdminDetail {
  id: string;
  korisnik: { ime: string; email: string | null; telefon: string | null };
  adresa: TemporaryOrderAdminAddress | null;
  stavke: TemporaryOrderAdminLineItem[];
  /** RAW number - see this file's header comment. */
  subtotal: number;
  /** RAW number - 0 as a placeholder until an admin sets it via setShipping()
   * when `zahtevaProceenuDostave` is true. */
  dostava: number;
  /** true = a freight-class item is in the cart - the customer CANNOT
   * self-confirm until an admin sets the real shipping cost. */
  zahtevaProceenuDostave: boolean;
  kupon: string | null;
  /** RAW number. */
  popust: number;
  /** RAW number. */
  ukupnaCena: number;
  napomena: string | null;
  /** `istekao` = true if the confirmation link/token has already expired. */
  token: { istice: string; istekao: boolean };
  vreme: { kreirano: string };
}
