import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Product } from '../../services/product';
import { ProductAdminListItem } from '../../models/product';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

@Component({
  selector: 'app-admin-product-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-product-list.html',
  styleUrl: './admin-product-list.scss',
})
export class AdminProductList implements OnInit {
  private product = inject(Product);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<ProductAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private search = '';
  /** Page size currently requested from the API - kept as state (like
   * `search`/`sort`/`order` below) so a page-size change made via the
   * paginator's dropdown (`onPage`'s `event.pageSize`) is actually forwarded
   * on the next `load()` call, and so a reload after e.g. `remove()` keeps
   * using it instead of silently resetting back to the default. */
  private limit = 10;
  /** Sort state kept locally and forwarded to the API as `sort`/`order` -
   * `naziv` (name) and `kreiran` (createdAt) are truly server-side sorted (see
   * admin-catalog.controller.js's listProducts / product.service.js's
   * listProducts, which now whitelist and forward these two fields down to
   * productRepo.findProducts's existing `sort` option). `cena` (price) is
   * intentionally NOT marked sortable below: it's a computed value across a
   * product's `variations` sub-documents, not a scalar column on the Product
   * schema, so a real DB-level sort would need an aggregation-pipeline change -
   * not the trivial addition the other two were, so it's left out rather than
   * silently wired as a no-op. `aktivan` (isActive) IS included below - it's a
   * plain indexed boolean column on the Product schema (see
   * admin-catalog.controller.js's PRODUCT_SORT_FIELDS), same trivial case as
   * naziv/kreiran. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ createdAt: -1 }` in
   * product.repository.js/findProducts) so the header shows the true current
   * sort on first load instead of looking unsorted. */
  defaultSort = { active: 'kreiran', direction: 'desc' as const };

  columns: DataTableColumn<ProductAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'kategorije', label: 'Kategorije', value: (row) => row.kategorije.join(', ') },
    { key: 'cena', label: 'Cena', value: (row) => (row.naUpit ? 'Na upit' : (row.cena ?? '-')) },
    { key: 'stanje', label: 'Stanje' },
    { key: 'brojVarijanti', label: 'Varijante' },
    { key: 'aktivan', label: 'Aktivan', type: 'badge', sortable: true },
    { key: 'kreiran', label: 'Kreiran', type: 'date', sortable: true },
  ];

  actions: DataTableAction<ProductAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/prodavnica', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/prodavnica', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati proizvod?', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.product
      .listAdmin({
        page,
        limit: this.limit,
        search: this.search || undefined,
        sort: this.sort ?? undefined,
        order: this.order ?? undefined,
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju proizvoda.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.limit = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  onSearch(term: string): void {
    this.search = term;
    this.load(1);
  }

  onSort(sort: Sort): void {
    this.sort = sort.direction ? sort.active : null;
    this.order = sort.direction ? (sort.direction as 'asc' | 'desc') : null;
    this.load(1);
  }

  remove(row: ProductAdminListItem): void {
    this.product.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Proizvod je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
