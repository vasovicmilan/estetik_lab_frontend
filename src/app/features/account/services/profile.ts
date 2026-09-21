import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { PasswordChangePayload, ProfileUpdatePayload, UserProfile } from '../models/profile';

/** Method names mirror the backend's /api/v1/me routes - gated only by
 * apiAuthMiddleware (any logged-in user), no manage_* permission required. */
@Injectable({ providedIn: 'root' })
export class Profile {
  private api = inject(Api);

  get(): Observable<UserProfile> {
    return this.api.get<UserProfile>('me');
  }

  update(payload: ProfileUpdatePayload): Observable<UserProfile> {
    return this.api.put<UserProfile>('me', payload);
  }

  changePassword(payload: PasswordChangePayload): Observable<{ message: string }> {
    return this.api.put<{ message: string }>('me/password', payload);
  }

  /** password is optional - Google-login accounts have none, so the backend
   * doesn't require it either. DELETE with a JSON body needs deleteWithBody()
   * (see Api's own comment - HttpClient's plain delete() has no body support). */
  deactivate(password?: string): Observable<{ message: string }> {
    return this.api.deleteWithBody<{ message: string }>('me', { password });
  }
}
