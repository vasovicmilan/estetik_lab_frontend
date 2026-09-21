// Mirrors GET /api/v1/partner/dashboard on the backend - a single combined
// summary view for the partner portal's landing page (mapPartnerForPartnerDetail
// + payoutRequestService.getBalance() + couponService.listCouponsForPartner(),
// see src/controllers/api/v1/partner.controller.js's dashboard()).

import { PartnerCommissionEntry } from './commission';
import { PartnerPayoutRequest } from './payout';

export interface PartnerSelf {
  id: string;
  imePrezime: string;
  /** Already formatted, e.g. "10%" - see mapPartnerForPartnerDetail. */
  procenatProvizijeUsluge: string;
  procenatProvizijeArtikli: string;
}

export interface PartnerBalance {
  /** Raw RSD numbers - this app has no currency pipe, render with " RSD"
   * appended client-side (same convention as employee-portal's balance). */
  earned: number;
  paid: number;
  /** Requested + approved, not yet paid. */
  reserved: number;
  /** max(0, earned - paid - reserved). */
  available: number;
}

/** Raw enum, translate client-side (same "Procenat"/"Fiksni iznos" labels the
 * admin coupons feature already uses - see coupons/components/admin-coupon-form). */
export type PartnerCouponDiscountType = 'percentage' | 'fixed';

export interface PartnerCouponProductDiscount {
  discountType: PartnerCouponDiscountType;
  discountValue: number;
  /** Ids of eligible products - empty array = all eligible products. */
  applicableProducts: string[];
}

export interface PartnerCoupon {
  id: string;
  code: string;
  discountType: PartnerCouponDiscountType;
  discountValue: number;
  /** Ids - empty array = applies to ALL services. */
  applicableServices: string[];
  /** Ids - empty array = applies to ALL packages. */
  applicablePackages: string[];
  productDiscount: PartnerCouponProductDiscount | null;
}

export interface PartnerDashboard {
  partner: PartnerSelf;
  balance: PartnerBalance;
  coupons: PartnerCoupon[];
  /** Only populated when needed to label restricted coupons (i.e. when a
   * coupon's applicableServices/applicablePackages isn't empty). */
  serviceNamesById: Record<string, string>;
  packageNamesById: Record<string, string>;
  /** Excluded-category names for product coupons. */
  categoryNamesById: Record<string, string>;
  /** Up to 5. */
  recentCommissions: PartnerCommissionEntry[];
  /** Up to 3. */
  payoutRequests: PartnerPayoutRequest[];
}
