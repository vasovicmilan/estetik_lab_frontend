// Mirrors the backend's admin-package-purchase.controller.js / mapper. A
// PackagePurchase is a package that has been sold/assigned to a user - distinct
// from the Package catalog itself (features/packages-catalog/), which defines
// what CAN be sold. Permission `manage_packages` (same as the catalog).
//
// Unlike Coupon/Package there is no separate edit payload here: after creation
// only `expiresAt`/`notes` are ever editable (see PackagePurchaseUpdatePayload),
// everything else (package, price, user) is fixed at purchase time, so there is
// no admin-package-purchase-form pretending to edit the whole record - see
// admin-package-purchase-detail's inline expiresAt/notes editor instead.

export type PackagePurchaseStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface PackagePurchaseItemDisplay {
  usluga: string;
  varijanta: string;
  ukupnoSeansi: number;
  iskorisceno: number;
  rezervisano: number;
  preostalo: number;
}

// ---- (1) Admin list row - GET /admin/package-purchases ----

export interface PackagePurchaseAdminListItem {
  id: string;
  paket: string;
  stavke: PackagePurchaseItemDisplay[];
  /** Already formatted, e.g. "5.000 RSD". */
  cena: string;
  /** Already Serbian: "Aktivan" | "Iskorišćen" | "Istekao" | "Otkazan". */
  status: string;
  statusRaw: PackagePurchaseStatus;
  /** Formatted purchase date. */
  kupljeno: string;
  /** Formatted expiry date, or the literal string "Ne ističe" if no expiry. */
  istice: string;
}

// ---- (2) Admin detail - GET /admin/package-purchases/:packagePurchaseId ----

export interface PackagePurchaseAdminDetail {
  id: string;
  korisnik: string;
  korisnikEmail: string | null;
  paket: string;
  stavke: PackagePurchaseItemDisplay[];
  /** Raw numbers - this app has no currency pipe, render with " RSD" suffix
   * client-side (same convention as employee-portal/partner-portal earnings). */
  originalnaCena: number;
  popust: number;
  placeno: number;
  status: string;
  statusRaw: PackagePurchaseStatus;
  napomena: string | null;
  /** "YYYY-MM-DD" or "" if no expiry - a plain calendar date, use directly as a
   * native <input type="date"> value (no timezone conversion needed, unlike
   * naive datetime-local fields elsewhere in this app). */
  expiresAtRaw: string;
  vreme: { kupljeno: string; istice: string };
}

// ---- (3) Write payloads ----

/** Body for POST /admin/package-purchases. */
export interface PackagePurchaseCreatePayload {
  userId: string;
  packageId: string;
  /** ISO date, optional. */
  expiresAt?: string;
  pricePaid?: number;
  couponCode?: string;
  notes?: string;
}

/** Body for PUT /admin/package-purchases/:packagePurchaseId - the ONLY fields
 * editable after creation. */
export interface PackagePurchaseUpdatePayload {
  expiresAt?: string;
  notes?: string;
}

// ---- Coupon preview (POST /admin/package-purchases/check-coupon) ----

export interface PackagePurchaseCheckCouponPayload {
  code: string;
  packageId: string;
  userId?: string;
}

export interface PackagePurchaseCouponPreview {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}
