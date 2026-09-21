// Every /api/v1 endpoint responds with this envelope (see docs/sr/15-api-v1-referenca.md):
// { success: true, data, meta? } on success, { success: false, error: {...} } on failure.

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
  seo?: SeoData;
}

export interface ApiErrorBody {
  id?: string;
  status?: number;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T>;

// Attached to entity-detail routes (getService/getPackage/getProduct/getPost/
// getTeamMember - see catalog.controller.js) - same shape generateSeo() builds
// server-side for the web app, just delivered as JSON instead of passed to
// res.render(). SeoService.apply() reads this and sets the page's tags.
export interface SeoJsonLd {
  [key: string]: unknown;
}

export interface SeoOpenGraph {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export interface SeoTwitterCard {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface SeoData {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  jsonLd: SeoJsonLd | SeoJsonLd[];
  meta: { keywords?: string };
  og: SeoOpenGraph;
  twitter: SeoTwitterCard;
}
