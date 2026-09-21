import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { ServiceDetail, ServiceEditPayload, ServiceListItem, PublicServiceDetail, ServicePublicCard } from '../models/service';

/**
 * Method names mirror the backend's own repository/service split (see
 * admin-catalog.routes.js / catalog.routes.js) - listAdmin ⇄ listServices,
 * getForEdit ⇄ getServiceForEdit, etc. - so a change on one side is easy to find
 * the matching side of.
 */
@Injectable({ providedIn: 'root' })
export class Service {
  private api = inject(Api);

  // ---- Admin ----

  listAdmin(params: FilterParams): Observable<{ data: ServiceListItem[]; meta?: ApiMeta }> {
    return this.api.getList<ServiceListItem[]>('admin/services', params);
  }

  /** Display shape - GET /admin/services/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<ServiceDetail> {
    return this.api.get<ServiceDetail>(`admin/services/${id}`);
  }

  /** Raw/edit shape - GET /admin/services/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<ServiceEditPayload> {
    return this.api.get<ServiceEditPayload>(`admin/services/${id}/edit`);
  }

  create(payload: ServiceEditPayload): Observable<ServiceEditPayload> {
    return this.api.post<ServiceEditPayload>('admin/services', payload);
  }

  update(id: string, payload: ServiceEditPayload): Observable<ServiceDetail> {
    return this.api.put<ServiceDetail>(`admin/services/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/services/${id}`);
  }

  /** POST /api/v1/admin/uploads/services - see admin-uploads.routes.js. */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/services', file, 'file');
  }

  uploadGallery(files: File[]): Observable<ImageReference[]> {
    return this.api.uploadMultiple<ImageReference[]>('admin/uploads/services/gallery', files, 'gallery');
  }

  // ---- Public ----

  listPublic(params: { category?: string; tag?: string; page?: number }): Observable<{ data: ServicePublicCard[]; meta?: ApiMeta }> {
    return this.api.getList<ServicePublicCard[]>('services', params);
  }

  /** Includes `seo` (see ApiResponse.seo) - use getWithSeo, not get(), so the SEO
   * resolver (see service-detail-resolver.ts) has something to apply. */
  getBySlugWithSeo(slug: string): Observable<ApiResponse<PublicServiceDetail>> {
    return this.api.getWithSeo<PublicServiceDetail>(`services/${slug}`);
  }
}
