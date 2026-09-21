import { ImageDisplay } from '../../../core/models/upload';

// Mirrors mapUserForAdminShort / mapUserForAdminDetail on the backend (see
// user.mapper.js) - same Serbian-keyed, pre-formatted DISPLAY shapes as
// order.ts/appointment.ts's split. There is no "edit payload" shape here: the
// only user-editable fields (firstName/lastName/phone, see
// validateProfileUpdate) are sent straight from admin-user-detail's inline
// form, and status/role/verify/anonymize/delete are all separate single-purpose
// endpoints rather than one big form.

export type UserStatus = 'guest' | 'pending' | 'active' | 'inactive' | 'suspended';

// ---- Admin list row - GET /admin/users ----

export interface UserAdminListItem {
  id: string;
  imePrezime: string;
  slika: ImageDisplay | null;
  email: string;
  telefon: string | null;
  uloga: string;
  status: string;
  statusRaw: UserStatus;
  poslednjiLogin: string;
  registrovan: string;
}

// ---- Admin detail - GET /admin/users/:userId ----

export interface UserAdminDetail {
  id: string;
  imePrezime: string;
  firstName: string;
  lastName: string;
  email: string;
  telefon: string | null;
  nacinPrijave: string;
  uloga: string;
  roleId: string | null;
  avatar: string | null;
  status: string;
  statusRaw: UserStatus;
  potvrdjenEmail: 'Da' | 'Ne';
  poslednjiLogin: string | null;
  vreme: { registrovan: string; azuriran: string };
}

// ---- Action payloads ----

/** Body for PUT .../users/:userId - see validateProfileUpdate: every field
 * optional, only firstName/lastName/phone accepted (no address management
 * here - deliberately skipped per the task spec, keep this a simple form). */
export interface UserProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ---- Role picker (GET /admin/roles, permission manage_roles - may 403 for an
// admin without that permission, handled by User.listRolesForPicker()) ----

export interface RoleOption {
  id: string;
  naziv: string;
}
