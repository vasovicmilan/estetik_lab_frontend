import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { ProductAdminDetail, ProductAdminListItem, ProductEditPayload, ProductPublicCard, ProductPublicDetail } from '../models/product';

/**
 * Method names mirror the backend's own repository/service split, same as
 * services-catalog/services/service.ts - listAdmin ⇄ listProducts, getForEdit ⇄
 * getProductForEdit, etc. (see admin-catalog.routes.js / catalog.routes.js).
 */
@Injectable({ providedIn: 'root' })
export class Product {
  private api = inject(Api);

  // ---- Admin ----

  listAdmin(params: FilterParams): Observable<{ data: ProductAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<ProductAdminListItem[]>('admin/products', params);
  }

  /** Display shape - GET /admin/products/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<ProductAdminDetail> {
    return this.api.get<ProductAdminDetail>(`admin/products/${id}`);
  }

  /** Raw/edit shape - GET /admin/products/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<ProductEditPayload> {
    return this.api.get<ProductEditPayload>(`admin/products/${id}/edit`);
  }

  create(payload: ProductEditPayload): Observable<ProductEditPayload> {
    return this.api.post<ProductEditPayload>('admin/products', payload);
  }

  update(id: string, payload: ProductEditPayload): Observable<ProductEditPayload> {
    return this.api.put<ProductEditPayload>(`admin/products/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/products/${id}`);
  }

  /** POST /api/v1/admin/uploads/products - see admin-uploads.routes.js. */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/products', file, 'file');
  }

  uploadGallery(files: File[]): Observable<ImageReference[]> {
    return this.api.uploadMultiple<ImageReference[]>('admin/uploads/products/gallery', files, 'gallery');
  }

  // ---- Public ----

  listPublic(params: { category?: string; tag?: string; search?: string; page?: number }): Observable<{
    data: ProductPublicCard[];
    meta?: ApiMeta;
  }> {
    return this.api.getList<ProductPublicCard[]>('products', params);
  }

  /** Includes `seo` (see ApiResponse.seo) - use getWithSeo, not get(), so the SEO
   * resolver (see product-detail-resolver.ts) has something to apply. */
  getBySlugWithSeo(slug: string): Observable<ApiResponse<ProductPublicDetail>> {
    return this.api.getWithSeo<ProductPublicDetail>(`products/${slug}`);
  }
}
