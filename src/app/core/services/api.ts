import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiMeta } from '../models/api-response';

/**
 * Thin wrapper every feature service goes through instead of injecting HttpClient
 * directly - the one place that knows the base URL and how to turn a params object
 * into a query string. Every /api/v1 endpoint responds { success, data, meta?, seo? }
 * (see docs/sr/15-api-v1-referenca.md); auth/error handling for the envelope's
 * `success: false` shape lives in error-interceptor.ts, not here, so this stays a
 * plain data-fetching layer.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: this.buildParams(params) })
      .pipe(map((res) => res.data));
  }

  getList<T>(path: string, params?: Record<string, unknown>): Observable<{ data: T; meta?: ApiMeta }> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: this.buildParams(params) })
      .pipe(map((res) => ({ data: res.data, meta: res.meta })));
  }

  /** Same as get(), but also hands back the `seo` field an entity-detail route sends. */
  getWithSeo<T>(path: string, params?: Record<string, unknown>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: this.buildParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body).pipe(map((res) => res.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, body).pipe(map((res) => res.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`).pipe(map((res) => res.data));
  }

  /** Same as delete(), but sends a JSON body - HttpClient's delete() doesn't support
   * one, and DELETE /api/v1/cart/items needs { cartItemId } in the body (see
   * cart.routes.js). Added alongside the shop feature rather than changing delete()'s
   * signature, since other features already depend on its no-body form. */
  deleteWithBody<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .request<ApiResponse<T>>('DELETE', `${this.baseUrl}/${path}`, { body })
      .pipe(map((res) => res.data));
  }

  /** Multipart upload - see POST /api/v1/admin/uploads/:type(/gallery|/video). */
  upload<T>(path: string, file: File, fieldName: 'file' | 'gallery' | 'video' = 'file'): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData).pipe(map((res) => res.data));
  }

  uploadMultiple<T>(path: string, files: File[], fieldName: 'gallery' | 'video' = 'gallery'): Observable<T> {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData).pipe(map((res) => res.data));
  }
}
