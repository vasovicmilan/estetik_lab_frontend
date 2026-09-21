import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ImageReference } from '../../../core/models/upload';
import { SiteSettings, SiteSettingsPolicyUpdate, SiteSettingsUpdatePayload } from '../models/site-settings';

/** `admin/site-settings`, permission `manage_site_content`. */
@Injectable({ providedIn: 'root' })
export class AdminSiteSettings {
  private api = inject(Api);

  get(): Observable<SiteSettings> {
    return this.api.get<SiteSettings>('admin/site-settings');
  }

  /** Response only carries bookingPolicy/currency/commissionPolicy (see
   * SiteSettingsPolicyUpdate's comment) - caller merges it onto the hero
   * fields it already has. */
  update(payload: SiteSettingsUpdatePayload): Observable<SiteSettingsPolicyUpdate> {
    return this.api.put<SiteSettingsPolicyUpdate>('admin/site-settings', payload);
  }

  /** POST /api/v1/admin/uploads/site - single hero image, same shape/flow as
   * BusinessPartner.uploadImage() / Category.uploadImage(). */
  uploadHeroImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/site', file, 'file');
  }
}
