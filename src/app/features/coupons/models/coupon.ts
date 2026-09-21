// Mirrors the backend's coupon.mapper.js. A Coupon is an admin-managed discount
// code - permission `manage_coupons`, module `coupons`. Same three-shape split as
// Category/BusinessPartner (see those models' header comments for the full
// rationale):
//
// 1. CouponAdminListItem - GET /admin/coupons             (mapCouponsForAdminList)
// 2. CouponAdminDetail    - GET /admin/coupons/:id          (mapCouponForAdminDetail)
// 3. CouponEditPayload    - GET /admin/coupons/:id/edit, and the body of POST/PUT (mapCouponForEdit)
//
// NOTE: GET /admin/coupons/:id used to be (incorrectly) wired to the raw edit
// shape - that's now fixed to return the display shape below, with a new
// GET /admin/coupons/:id/edit added for the raw shape. admin-coupon-form must
// use getForEdit(), never getById(), to populate itself.

// ---- (1) Admin list row ----

export interface CouponAdminListItem {
  id: string;
  kod: string;
  /** "Procenat" | "Fiksni iznos". */
  tip: string;
  /** Formatted, e.g. "15%" or "500,00 RSD". */
  popust: string;
  /** A number, or the literal string "Neograničeno". */
  maxUpotreba: number | string;
  iskorisceno: number;
  /** "Aktivan" | "Neaktivan". */
  aktivnost: string;
  vaziOd: string;
  vaziDo: string;
  kreiran: string;
}

// ---- (2) Admin detail (display only) - NOT the shape admin-coupon-form posts back ----

export interface CouponAdminDetailOsnovno {
  kod: string;
  tip: string;
  popust: string;
  maxPopust: string | null;
  minimalnaVrednost: string | null;
  aktivnost: string;
}

export type CouponAdminDetailProizvodi =
  | { aktivno: false }
  | {
      aktivno: true;
      tip: string;
      popust: string;
      maxPopust: string | null;
      minimalnaVrednostPorudzbine: string | null;
    };

export interface CouponAdminDetailOgranicenja {
  maxUpotreba: number | string;
  maxUpotrebaPoKorisniku: number | string;
  trenutnoIskorisceno: number;
}

export interface CouponAdminDetailVremeVazenja {
  pocinje: string | null;
  istice: string | null;
}

export interface CouponAdminDetailRef {
  id: string;
  naziv?: string;
}

export interface CouponAdminDetailPartner {
  id: string;
  imePrezime: string;
}

export interface CouponAdminDetailUsageEntry {
  korisnikId: string | null;
  terminId: string | null;
  paketId: string | null;
  porudzbinaId: string | null;
  iznosPopusta: string;
  iskoriscenoU: string;
}

export interface CouponAdminDetail {
  id: string;
  osnovno: CouponAdminDetailOsnovno;
  proizvodi: CouponAdminDetailProizvodi;
  ogranicenja: CouponAdminDetailOgranicenja;
  vremeVazenja: CouponAdminDetailVremeVazenja;
  primenljivoNaUsluge: CouponAdminDetailRef[];
  primenljivoNaPakete: CouponAdminDetailRef[];
  primenljivoNaProizvode: CouponAdminDetailRef[];
  iskljuceneKategorijeArtikala: CouponAdminDetailRef[];
  partner: CouponAdminDetailPartner | null;
  istorijaKoriscenja: CouponAdminDetailUsageEntry[];
  vreme: { kreiran: string; poslednjeIzmenjen: string };
}

// ---- (3) Edit / write shape (mapCouponForEdit) ----

export type CouponDiscountType = 'percentage' | 'fixed';

export interface CouponEditPayload {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minValue: number;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  applicableServices: string[];
  applicablePackages: string[];
  productDiscountEnabled: boolean;
  productDiscountType: CouponDiscountType;
  productDiscountValue: number;
  productDiscountMaxAmount: number | null;
  productMinOrderValue: number;
  applicableProducts: string[];
  excludedCategories: string[];
  partner: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

// ---- Create/update payload actually POSTed/PUT - same flat shape minus `id` ----

export type CouponWritePayload = Omit<CouponEditPayload, 'id'>;
