import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { Api } from './api';
import { AuthUser, LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '../models/auth';

const TOKEN_KEY = 'estetik_lab_token';

/**
 * Token storage + decoded user state. Token lives 24h with no refresh mechanism
 * (docs/sr/15-api-v1-referenca.md) - there's nothing to renew, so the only job here
 * is: hold the token, decode the user out of it, and clear both on 401 (see
 * error-interceptor.ts). localStorage is guarded behind isPlatformBrowser() because
 * this app renders on the server first (SSR) where there is no localStorage.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /** null = not logged in. Populated from the stored token on construction. */
  currentUser = signal<AuthUser | null>(this.readUserFromStoredToken());

  // POST /api/v1/auth/login - see auth.controller.js's login(). Real path, not the
  // Serbian-guessed "auth/prijava" this used to (wrongly) call.
  login(payload: LoginPayload) {
    return this.api.post<LoginResponse>('auth/login', payload).pipe(
      tap((res) => this.setSession(res.token))
    );
  }

  // POST /api/v1/auth/register - does NOT log the caller in (see RegisterResponse's
  // comment: no token in the response, email verification is required first except
  // for the very first account ever created). Caller should show
  // res.message and route to /prijava, not expect a session here.
  register(payload: RegisterPayload) {
    return this.api.post<RegisterResponse>('auth/register', payload);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/prijava']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  /** True for anyone holding at least one manage_* permission this frontend has
   * an admin area for - used to decide whether to show the "Admin" nav link at
   * all, without hard-coding it to just manage_services. */
  hasAnyAdminAccess(): boolean {
    return (
      this.hasPermission('manage_appointments_all') ||
      this.hasPermission('manage_services') ||
      this.hasPermission('manage_packages') ||
      this.hasPermission('manage_products') ||
      this.hasPermission('manage_orders') ||
      this.hasPermission('manage_users') ||
      this.hasPermission('manage_employees') ||
      this.hasPermission('manage_blog') ||
      this.hasPermission('manage_taxonomy') ||
      this.hasPermission('manage_resources') ||
      this.hasPermission('manage_partners') ||
      this.hasPermission('manage_marketing') ||
      this.hasPermission('manage_coupons') ||
      this.hasPermission('manage_payouts') ||
      this.hasPermission('view_logs') ||
      this.hasPermission('view_business_reports') ||
      this.hasPermission('manage_site_content')
    );
  }

  private setSession(token: string): void {
    if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
    this.currentUser.set(this.decodeToken(token));
  }

  clearSession(): void {
    if (this.isBrowser) localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
  }

  private readUserFromStoredToken(): AuthUser | null {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }

  // Decode-only (no signature check - the browser can't verify a JWT signed with a
  // server-side secret anyway). Every real authorization decision still happens
  // server-side via apiAuthMiddleware/requirePermission; this is purely for the UI
  // to know who's logged in and which nav items/buttons to show.
  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as AuthUser;
    } catch {
      return null;
    }
  }
}
