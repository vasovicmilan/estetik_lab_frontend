import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import {
  BusinessPartnerAdminDetail,
  BusinessPartnerAdminListItem,
  BusinessPartnerEditPayload,
  BusinessPartnerPublicDetail,
  BusinessPartnerPublicListItem,
  BusinessPartnerWritePayload,
} from '../models/business-partner';

/** Method names mirror the backend's admin-business-partners routes - listAdmin ⇄
 * listBusinessPartners, getForEdit ⇄ getBusinessPartnerForEdit, etc. (see
 * category.ts for the same convention). Permission `manage_marketing`, NOT
 * module-gated.
 *
 * listPublic()/getPublicBySlug() below hit the separate unauthenticated
 * catalog.routes.js endpoints (GET /business-partners, /business-partners/:slug -
 * NOT under /admin), same "one service, admin + public sections" split as
 * features/blog/services/post.ts's Post service. */
@Injectable({ providedIn: 'root' })
export class BusinessPartner {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: BusinessPartnerAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<BusinessPartnerAdminListItem[]>('admin/business-partners', params);
  }

  /** Display shape - GET /admin/business-partners/:id. Fine for a read-only
   * detail view, NOT for a form. */
  getById(id: string): Observable<BusinessPartnerAdminDetail> {
    return this.api.get<BusinessPartnerAdminDetail>(`admin/business-partners/${id}`);
  }

  /** Raw/edit shape - GET /admin/business-partners/:id/edit. Use this to
   * populate the admin form. */
  getForEdit(id: string): Observable<BusinessPartnerEditPayload> {
    return this.api.get<BusinessPartnerEditPayload>(`admin/business-partners/${id}/edit`);
  }

  create(payload: BusinessPartnerWritePayload): Observable<BusinessPartnerEditPayload> {
    return this.api.post<BusinessPartnerEditPayload>('admin/business-partners', payload);
  }

  update(id: string, payload: BusinessPartnerWritePayload): Observable<BusinessPartnerEditPayload> {
    return this.api.put<BusinessPartnerEditPayload>(`admin/business-partners/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/business-partners/${id}`);
  }

  /** POST /api/v1/admin/uploads/business-partners - single image only, same
   * shape/flow as Category.uploadImage(). */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/business-partners', file, 'file');
  }

  // ---- Public ----

  /** GET /business-partners - no pagination, returns every active partner. */
  listPublic(): Observable<BusinessPartnerPublicListItem[]> {
    return this.api.get<BusinessPartnerPublicListItem[]>('business-partners');
  }

  getPublicBySlug(slug: string): Observable<BusinessPartnerPublicDetail> {
    return this.api.get<BusinessPartnerPublicDetail>(`business-partners/${slug}`);
  }
}
