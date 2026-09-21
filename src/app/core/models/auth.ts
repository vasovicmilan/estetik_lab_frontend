// Matches signJwt({ id, email, roleId, roleName, permissions, isEmployee, isPartner })
// in the backend's auth.service.js (login()/register()) - this is exactly what's
// decoded out of the Bearer token and put on req.user server-side, so it's what
// GET /api/v1/auth/ja (whoAmI) returns too.

export interface AuthUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isEmployee: boolean;
  isPartner: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Matches auth.controller.js's login() response body exactly (note: no roleId here -
// that only lives inside the JWT itself, decoded client-side in auth.ts).
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
    permissions: string[];
    isEmployee: boolean;
    isPartner: boolean;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// register() does NOT return a token (see auth.controller.js's register()) - a new
// account needs email verification before it can log in, except the very first
// account ever created (auto-admin, no verification gate) - see auth.service.js.
export interface RegisterResponse {
  id: string;
  email: string;
  isFirstUser: boolean;
  message: string;
}
