// GET/PUT /admin/profile (admin-ops.controller.js's getProfile/updateProfile)
// is backed by the exact same userService.findUserProfile/updateProfile
// functions as /api/v1/me (me.controller.js's own profile GET/PUT) - so this
// mirrors account/models/profile.ts's UserProfile/ProfileUpdatePayload field
// for field rather than inventing a new shape. Kept as its own copy (not a
// cross-feature import - no other feature in this app imports another
// feature's models) since admin-ops points at a different route base
// (`admin/profile`) under a different shell (AdminShell, not AccountShell).

export interface AdminOwnProfile {
  id: string;
  imePrezime: string;
  firstName: string;
  lastName: string;
  email: string;
  telefon: string | null;
  uloga: string;
  avatar: string | null;
  /** e.g. "Lokalni nalog" | "Google" - display only, never editable from here. */
  nacinPrijave: string;
  status: string;
  poslednjiLogin: string | null;
  clanOd: string;
}

/** Body for PUT /admin/profile - mirrors validateProfileUpdate exactly
 * (firstName/lastName/phone, all optional). */
export interface AdminProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
