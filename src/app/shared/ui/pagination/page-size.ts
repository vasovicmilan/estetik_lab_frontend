import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Page sizes a visitor can pick on public listings - same set as the backend's PUBLIC_PAGE_SIZES
 * (utils/pagination.util.js); anything else the API falls back to its own default. */
export const PUBLIC_PAGE_SIZES = [6, 9, 12, 24, 48];

/** Serbian labels for every mat-paginator in the app (provided in app.config). */
@Injectable()
export class SerbianPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Po strani:';
  override nextPageLabel = 'Sledeća strana';
  override previousPageLabel = 'Prethodna strana';
  override firstPageLabel = 'Prva strana';
  override lastPageLabel = 'Poslednja strana';
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) return `0 od ${length}`;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1} – ${end} od ${length}`;
  };
}
