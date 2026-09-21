// Mirrors GET/PUT /api/v1/me and PUT /me/password, DELETE /me on the backend -
// the logged-in user's own profile, distinct from the admin's UserAdminDetail
// (features/users/models/user.ts): fewer fields, no role/permission management,
// no other-user lookups. Kept in its own top-level `account` feature (not nested
// under admin) since this is a customer-facing self-service area, gated by plain
// authGuard rather than permissionGuard.

export interface UserProfile {
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

/** Body for PUT /me - every field optional and independently updatable. */
export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Body for PUT /me/password. confirmPassword is checked against newPassword
 * client-side for instant feedback, but the backend re-validates regardless. */
export interface PasswordChangePayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
