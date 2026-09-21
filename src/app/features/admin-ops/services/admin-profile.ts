import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { AdminOwnProfile, AdminProfileUpdatePayload } from '../models/admin-profile';

/** `admin/profile` - the logged-in admin's own profile, gated only by the
 * router's base `access_admin_panel` requirement (no extra manage_*
 * permission). Mirrors account/services/profile.ts's Profile service, pointed
 * at admin/profile instead of me. */
@Injectable({ providedIn: 'root' })
export class AdminProfile {
  private api = inject(Api);

  get(): Observable<AdminOwnProfile> {
    return this.api.get<AdminOwnProfile>('admin/profile');
  }

  update(payload: AdminProfileUpdatePayload): Observable<AdminOwnProfile> {
    return this.api.put<AdminOwnProfile>('admin/profile', payload);
  }
}
