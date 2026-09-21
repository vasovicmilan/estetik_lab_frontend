import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { TestimonialAdminDetail, TestimonialAdminListItem } from '../models/testimonial';

/** Method names mirror the backend's admin-testimonials routes. Permission
 * `manage_marketing`, NOT module-gated. No create/update here - testimonials
 * are submitted publicly by customers; admin only reviews (approve/reject/
 * feature) and can delete, never creates or edits the content. */
@Injectable({ providedIn: 'root' })
export class Testimonial {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: TestimonialAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<TestimonialAdminListItem[]>('admin/testimonials', params);
  }

  getById(id: string): Observable<TestimonialAdminDetail> {
    return this.api.get<TestimonialAdminDetail>(`admin/testimonials/${id}`);
  }

  /** PUT .../:id/approve - approves and sets the featured flag in one step. */
  approve(id: string, isFeatured: boolean): Observable<TestimonialAdminDetail> {
    return this.api.put<TestimonialAdminDetail>(`admin/testimonials/${id}/approve`, { isFeatured });
  }

  reject(id: string): Observable<TestimonialAdminDetail> {
    return this.api.put<TestimonialAdminDetail>(`admin/testimonials/${id}/reject`, {});
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/testimonials/${id}`);
  }
}
