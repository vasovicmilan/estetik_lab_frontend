// Public-facing business identity (contact + social), now wired to a real
// endpoint: GET /api/v1/business-info (unauthenticated). Response envelope's
// `data` is BusinessInfoResponse below, with Serbian field names and a flat
// `drustveneMreze` array of raw social profile URLs (no guaranteed order,
// no platform tag) - toBusinessInfo() maps that onto the BusinessInfo shape
// the footer template already renders against, detecting each URL's
// platform by hostname. All BusinessInfo fields stay optional so a partial
// response still renders safely field-by-field, with no field ever faked.

/** Raw shape returned by GET /api/v1/business-info's `data`. */
export interface BusinessInfoResponse {
  naziv?: string;
  email?: string;
  telefon?: string;
  telefonHref?: string;
  adresa?: string;
  drustveneMreze?: string[];
  slogan?: string | null;
  /** Koji moduli postoje u ovoj instanci (ENABLED_MODULES na backendu + izvedeni). */
  moduli?: Partial<SiteModules>;
}

export interface SiteModules {
  blog: boolean;
  shop: boolean;
  booking: boolean;
  coupons: boolean;
  partners: boolean;
  employees: boolean;
}

/** Dok info nije stigao (ili API padne) pretpostavlja se sve uključeno - ista ponašanja kao pre. */
export const ALL_MODULES_ON: SiteModules = { blog: true, shop: true, booking: true, coupons: true, partners: true, employees: true };

export interface BusinessInfo {
  name?: string;
  tagline?: string;
  modules: SiteModules;
  email?: string;
  phone?: string;
  phoneHref?: string;
  address?: string;
  social?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
}

/** Detects a social platform from a profile URL's hostname. Returns null for
 * anything that isn't one of the platforms the footer renders an icon/link
 * for, so unrecognized URLs are simply skipped rather than mis-bucketed. */
function detectSocialPlatform(url: string): keyof NonNullable<BusinessInfo['social']> | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
  if (hostname.includes('tiktok.com')) return 'tiktok';
  return null;
}

/** Maps the raw GET /api/v1/business-info response onto the BusinessInfo
 * shape the footer template reads from. */
export function toBusinessInfo(response: BusinessInfoResponse): BusinessInfo {
  const social: BusinessInfo['social'] = {};
  for (const url of response.drustveneMreze ?? []) {
    const platform = detectSocialPlatform(url);
    if (platform) social[platform] = url;
  }

  return {
    name: response.naziv,
    tagline: response.slogan || undefined,
    modules: { ...ALL_MODULES_ON, ...(response.moduli ?? {}) },
    email: response.email,
    phone: response.telefon,
    phoneHref: response.telefonHref,
    address: response.adresa,
    social: Object.keys(social).length ? social : undefined,
  };
}
