// Mirrors siteSettingsService's edit shape exactly (GET/PUT /admin/site-settings -
// see admin-ops.controller.js's getSiteSettings/updateSiteSettings). Permission
// `manage_site_content`.

export type SiteSettingsWeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Salon-wide DISPLAY schedule (kontakt/footer/SEO) - see
 * site-settings.model.js's WorkingHoursDaySchema. This is deliberately NOT
 * the same thing as Employee.workingHours (that stays the real booking-slot
 * source of truth, edited on the employee form instead) - one open/close
 * range per day, no shift blocks, plus `isOpen` for a fully closed day. */
export interface SiteSettingsWorkingHoursDay {
  day: SiteSettingsWeekDay;
  isOpen: boolean;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

/** One-off closure/holiday - see site-settings.model.js's ClosedDateSchema.
 * `recurringYearly: true` matches every year on the same month/day regardless
 * of the year stored in `date`. A hard, salon-wide override for booking
 * availability (see availability.service.js), independent of any employee's
 * own schedule. */
export interface SiteSettingsClosedDate {
  date: string; // ISO date
  reason: string;
  recurringYearly: boolean;
}

/** Effective business identity (admin-saved values over code/env defaults) - Podešavanja sajta -> Podaci o firmi. */
export interface SiteSettingsBusiness {
  name: string;
  legalName: string;
  alternateName: string;
  email: string;
  adminEmail: string;
  phone: string;
  taxId: string;
  registrationNumber: string;
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
  latitude: number | null;
  longitude: number | null;
  sameAs: string[];
}

export interface SiteSettingsShopPolicy {
  defaultShippingPrice: number;
  orderCommissionGraceDays: number;
}

export interface SiteSettings {
  hero: { image: string | null; imageAlt: string };
  bookingPolicy: {
    bufferMinutes: number;
    slotGridMinutes: number;
    userCancellationCutoffHours: number;
    rescheduleCutoffHours: number;
    rescheduleSameDayFloorHours: number;
    rescheduleMinLeadMinutes: number;
  };
  currency: { code: string; symbol: string; symbolPosition: 'before' | 'after' };
  commissionPolicy: { minimumSessionCommission: number };
  business: SiteSettingsBusiness;
  shopPolicy: SiteSettingsShopPolicy;
  workingHours: SiteSettingsWorkingHoursDay[];
  closedDates: SiteSettingsClosedDate[];
}

/** PUT body - every field optional (omit to leave unchanged server-side), but
 * this app always sends the full current+edited state since that's simplest
 * and safe here (see the task's own note on this). `heroImage` is a
 * `{ img }`-reference (uploaded via POST /admin/uploads/site first), not a raw
 * file - same "hero image reference, not upload" pattern used elsewhere. */
export interface SiteSettingsUpdatePayload {
  heroImage?: { img: string };
  heroImageAlt?: string;
  bufferMinutes?: number;
  slotGridMinutes?: number;
  userCancellationCutoffHours?: number;
  rescheduleCutoffHours?: number;
  rescheduleSameDayFloorHours?: number;
  rescheduleMinLeadMinutes?: number;
  currencyCode?: string;
  currencySymbol?: string;
  currencySymbolPosition?: 'before' | 'after';
  minimumSessionCommission?: number;
  businessName?: string;
  businessLegalName?: string;
  businessAlternateName?: string;
  businessEmail?: string;
  businessAdminEmail?: string;
  businessPhone?: string;
  businessTaxId?: string;
  businessRegistrationNumber?: string;
  businessStreetAddress?: string;
  businessAddressLocality?: string;
  businessPostalCode?: string;
  businessAddressCountry?: string;
  businessLatitude?: number | null;
  businessLongitude?: number | null;
  /** one URL per array item */
  businessSameAs?: string[];
  defaultShippingPrice?: number;
  orderCommissionGraceDays?: number;
}

/** PUT response shape - does NOT re-include `hero`, only the updated policy
 * blocks (see updateSiteSettings's comment on the backend). Callers merge this
 * back onto the hero fields they already have, or re-fetch GET. */
export type SiteSettingsPolicyUpdate = Pick<SiteSettings, 'bookingPolicy' | 'currency' | 'commissionPolicy'> & Partial<Pick<SiteSettings, 'business' | 'shopPolicy'>>;

/** PUT admin/site-settings/radno-vreme body - always the full 7-day list (the
 * backend's updateWorkingHours requires exactly 7 entries, one per day, no
 * duplicates - see site-settings.service.js). */
export type SiteSettingsWorkingHoursUpdatePayload = { workingHours: SiteSettingsWorkingHoursDay[] };

/** PUT admin/site-settings/neradni-dani body - a full replace of the closed-
 * dates list (add/remove rows client-side, then save the whole list). */
export type SiteSettingsClosedDatesUpdatePayload = { closedDates: SiteSettingsClosedDate[] };
