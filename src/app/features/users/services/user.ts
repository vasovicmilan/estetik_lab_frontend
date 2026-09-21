import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { RoleOption, UserAdminDetail, UserAdminListItem, UserProfileUpdatePayload, UserStatus } from '../models/user';

/** Method names mirror the backend's own admin-people routes for users (see
 * admin-people.controller.js) - permission `manage_users`, NOT module-gated.
 *
 * Named `User` (not `AdminUser`) - checked for a collision first: this app
 * already has `AuthUser` (core/models/auth.ts, an interface, not a class) and
 * `Auth` (core/services/auth.ts), but no other `class User`, so `User` is free
 * and unambiguous here. */
@Injectable({ providedIn: 'root' })
export class User {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: UserAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<UserAdminListItem[]>('admin/users', params);
  }

  getById(id: string): Observable<UserAdminDetail> {
    return this.api.get<UserAdminDetail>(`admin/users/${id}`);
  }

  updateProfile(id: string, payload: UserProfileUpdatePayload): Observable<unknown> {
    return this.api.put<unknown>(`admin/users/${id}`, payload);
  }

  updateStatus(id: string, status: UserStatus): Observable<unknown> {
    return this.api.put<unknown>(`admin/users/${id}/status`, { status });
  }

  updateRole(id: string, roleId: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/users/${id}/role`, { role: roleId });
  }

  verify(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/users/${id}/verify`, {});
  }

  anonymize(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/users/${id}/anonymize`, {});
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(`admin/users/${id}`);
  }

  /** GET /admin/roles - permission `manage_roles`, separate from `manage_users`.
   * An admin who can manage users but not roles gets a 403 here - caught and
   * turned into an empty list so admin-user-detail can just hide the role
   * control instead of failing to load. */
  listRolesForPicker(): Observable<RoleOption[]> {
    return this.api.getList<RoleOption[]>('admin/roles', { limit: 200 }).pipe(
      map(({ data }) => data),
      catchError(() => of([] as RoleOption[]))
    );
  }
}
