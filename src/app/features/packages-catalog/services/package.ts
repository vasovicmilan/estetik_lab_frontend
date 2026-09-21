import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { PackageAdminDetail, PackageCreatePayload, PackageEditPayload, PackageListItem, PackagePublicCard, PackagePublicDetail } from '../models/package';

@Injectable({ providedIn: 'root' })
export class Package {
  private api = inject(Api);

  // ---- Admin ----

  listAdmin(params: FilterParams): Observable<{ data: PackageListItem[]; meta?: ApiMeta }> {
    return this.api.getList<PackageListItem[]>('admin/packages', params);
  }

  /** Display shape - GET /admin/packages/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<PackageAdminDetail> {
    return this.api.get<PackageAdminDetail>(`admin/packages/${id}`);
  }

  /** Raw/edit shape - GET /admin/packages/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<PackageEditPayload> {
    return this.api.get<PackageEditPayload>(`admin/packages/${id}/edit`);
  }

  create(payload: PackageCreatePayload): Observable<PackageEditPayload> {
    return this.api.post<PackageEditPayload>('admin/packages', payload);
  }

  update(id: string, payload: PackageCreatePayload): Observable<PackageAdminDetail> {
    return this.api.put<PackageAdminDetail>(`admin/packages/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/packages/${id}`);
  }

  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/packages', file, 'file');
  }

  // ---- Public ----

  listPublic(params: { page?: number }): Observable<{ data: PackagePublicCard[]; meta?: ApiMeta }> {
    return this.api.getList<PackagePublicCard[]>('packages', params);
  }

  getBySlugWithSeo(slug: string): Observable<ApiResponse<PackagePublicDetail>> {
    return this.api.getWithSeo<PackagePublicDetail>(`packages/${slug}`);
  }
}
