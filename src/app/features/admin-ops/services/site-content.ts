import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import {
  SiteContentAbout,
  SiteContentAll,
  SiteContentPageSeo,
  SiteContentFaq,
  SiteContentHomeIntro,
  SiteContentLegalPage,
  SiteContentPartnership,
  SiteContentTeamIntro,
  SiteContentWhyUsItem,
} from '../models/site-content';

/** `admin/site-content`, permission `manage_site_content` - one GET-all + one
 * PUT-per-section, same shape as `AdminSiteSettings` above. */
@Injectable({ providedIn: 'root' })
export class AdminSiteContent {
  private api = inject(Api);

  get(): Observable<SiteContentAll> {
    return this.api.get<SiteContentAll>('admin/site-content');
  }

  updateAbout(payload: SiteContentAbout): Observable<SiteContentAbout> {
    return this.api.put<SiteContentAbout>('admin/site-content/o-nama', payload);
  }

  updateFaq(payload: SiteContentFaq): Observable<SiteContentFaq> {
    return this.api.put<SiteContentFaq>('admin/site-content/faq', payload);
  }

  updatePrivacyPolicy(payload: SiteContentLegalPage): Observable<SiteContentLegalPage> {
    return this.api.put<SiteContentLegalPage>('admin/site-content/politika-privatnosti', payload);
  }

  updateTermsAndConditions(payload: SiteContentLegalPage): Observable<SiteContentLegalPage> {
    return this.api.put<SiteContentLegalPage>('admin/site-content/uslovi-koriscenja', payload);
  }

  updatePartnership(payload: SiteContentPartnership): Observable<SiteContentPartnership> {
    return this.api.put<SiteContentPartnership>('admin/site-content/partnerski-program', payload);
  }

  updateHomeIntro(payload: SiteContentHomeIntro): Observable<SiteContentHomeIntro> {
    return this.api.put<SiteContentHomeIntro>('admin/site-content/pocetna-uvod', payload);
  }

  /** Backend takes the array directly wrapped in `{ whyUs }`, unlike every
   * other section above (see admin-ops.controller.js's updateWhyUs comment). */
  updateWhyUs(whyUs: SiteContentWhyUsItem[]): Observable<SiteContentWhyUsItem[]> {
    return this.api.put<SiteContentWhyUsItem[]>('admin/site-content/zasto-mi', { whyUs });
  }

  updateTeamIntro(payload: SiteContentTeamIntro): Observable<SiteContentTeamIntro> {
    return this.api.put<SiteContentTeamIntro>('admin/site-content/tim-uvod', payload);
  }

  /** Only the pages present in `pages` are updated (`{ home: { title, description, noIndex? } }`). */
  updatePageSeo(pages: Record<string, { title: string; description: string; noIndex?: boolean }>): Observable<SiteContentPageSeo> {
    return this.api.put<SiteContentPageSeo>('admin/site-content/seo-stranica', { pages });
  }
}
