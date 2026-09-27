import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Category } from '../../services/category';
import { CategoryAdminListItem } from '../../models/category';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** Mirrors services-catalog's admin-service-list exactly - see that component's
 * header for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-category-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-category-list.html',
  styleUrl: './admin-category-list.scss',
})
export class AdminCategoryList implements OnInit {
  private category = inject(Category);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  rows = signal<CategoryAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `naziv`/`domen`/`prioritet`/`aktivna` are plain scalar columns (name, domain,
   * meta.priority, meta.isActive) on the Category schema - see
   * CATEGORY_SORT_FIELDS in admin-taxonomy.controller.js. `roditelj` (populated
   * parent name) is NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ "meta.priority": -1, name: 1, _id: -1 }`
   * in category.repository.js/findCategories) - `prioritet` is the leading key. */
  defaultSort = { active: 'prioritet', direction: 'desc' as const };

  columns: DataTableColumn<CategoryAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'domen', label: 'Domen', sortable: true },
    { key: 'roditelj', label: 'Roditelj', value: (row) => row.roditelj ?? '-' },
    { key: 'prioritet', label: 'Prioritet', sortable: true },
    { key: 'aktivna', label: 'Aktivna', sortable: true },
  ];

  actions: DataTableAction<CategoryAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/kategorije', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/kategorije', row.id, 'izmena']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.category
      .listAdmin({ page, limit: this.limit, sort: this.sort ?? undefined, order: this.order ?? undefined })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju kategorija.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.limit = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  onSort(sort: Sort): void {
    this.sort = sort.direction ? sort.active : null;
    this.order = sort.direction ? (sort.direction as 'asc' | 'desc') : null;
    this.load(1);
  }

  remove(row: CategoryAdminListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati kategoriju "${row.naziv}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.category.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Kategorija je obrisana.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
