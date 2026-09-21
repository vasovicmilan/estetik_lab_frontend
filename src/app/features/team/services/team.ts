import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { ExpertAdminDetail, ExpertAdminListItem, ExpertEditPayload, TeamMemberCard, TeamMemberDetail } from '../models/expert';

/** GET /api/v1/team, GET /api/v1/team/:slug - NOT module-gated (see catalog.routes.js's
 * comment: the public team showcase is independent of the booking module). The
 * /api/v1/admin/experts/* admin endpoints are likewise NOT module-gated, just
 * behind requirePermission('manage_employees') (see admin-employees.routes.js). */
@Injectable({ providedIn: 'root' })
export class Team {
  private api = inject(Api);

  // ---- Admin ----

  listAdmin(params: FilterParams): Observable<{ data: ExpertAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<ExpertAdminListItem[]>('admin/experts', params);
  }

  /** Display shape - GET /admin/experts/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<ExpertAdminDetail> {
    return this.api.get<ExpertAdminDetail>(`admin/experts/${id}`);
  }

  /** Raw/edit shape - GET /admin/experts/:id/edit. Use this to populate the admin
   * form, same pattern as Service/Package/Product's :id/edit. */
  getForEdit(id: string): Observable<ExpertEditPayload> {
    return this.api.get<ExpertEditPayload>(`admin/experts/${id}/edit`);
  }

  create(payload: ExpertEditPayload): Observable<ExpertEditPayload> {
    return this.api.post<ExpertEditPayload>('admin/experts', payload);
  }

  update(id: string, payload: ExpertEditPayload): Observable<ExpertEditPayload> {
    return this.api.put<ExpertEditPayload>(`admin/experts/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/experts/${id}`);
  }

  /** POST /api/v1/admin/uploads/experts - see admin-uploads.routes.js. */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/experts', file, 'file');
  }

  uploadGallery(files: File[]): Observable<ImageReference[]> {
    return this.api.uploadMultiple<ImageReference[]>('admin/uploads/experts/gallery', files, 'gallery');
  }

  // ---- Public ----

  list(): Observable<TeamMemberCard[]> {
    return this.api.get<TeamMemberCard[]>('team');
  }

  getBySlugWithSeo(slug: string): Observable<ApiResponse<TeamMemberDetail>> {
    return this.api.getWithSeo<TeamMemberDetail>(`team/${slug}`);
  }
}
