import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ImageReference } from '../../../core/models/upload';
import {
  SiteSettings,
  SiteSettingsPolicyUpdate,
  SiteSettingsUpdatePayload,
  SiteSettingsWorkingHoursUpdatePayload,
  SiteSettingsClosedDatesUpdatePayload,
} from '../models/site-settings';

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

  /** admin/site-settings/radno-vreme - the salon-wide DISPLAY schedule only
   * (kontakt/footer/SEO). Returns the full settings shape (same as get()),
   * NOT just the working-hours slice, so the caller can refresh everything
   * from one response after saving. */
  updateWorkingHours(payload: SiteSettingsWorkingHoursUpdatePayload): Observable<SiteSettings> {
    return this.api.put<SiteSettings>('admin/site-settings/radno-vreme', payload);
  }

  /** admin/site-settings/neradni-dani - one-off closures/praznici, a hard
   * salon-wide override for booking availability (see availability.service.js),
   * independent of Employee.workingHours. */
  updateClosedDates(payload: SiteSettingsClosedDatesUpdatePayload): Observable<SiteSettings> {
    return this.api.put<SiteSettings>('admin/site-settings/neradni-dani', payload);
  }
}
