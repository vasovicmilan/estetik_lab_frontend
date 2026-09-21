// Mirrors siteSettingsService's edit shape exactly (GET/PUT /admin/site-settings -
// see admin-ops.controller.js's getSiteSettings/updateSiteSettings). Permission
// `manage_site_content`.

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
}

/** PUT response shape - does NOT re-include `hero`, only the updated policy
 * blocks (see updateSiteSettings's comment on the backend). Callers merge this
 * back onto the hero fields they already have, or re-fetch GET. */
export type SiteSettingsPolicyUpdate = Pick<SiteSettings, 'bookingPolicy' | 'currency' | 'commissionPolicy'>;
