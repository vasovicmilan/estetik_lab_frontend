// Matches the { search, page, limit, ...filters } query params every admin API
// list endpoint accepts (see admin-catalog.controller.js's listServices/listProducts,
// admin-taxonomy.controller.js's listCategories, etc.) - one shared shape so every
// feature service builds its query params the same way.

export interface FilterParams {
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export const DEFAULT_PAGE_SIZE = 10;
