import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Package } from '../../services/package';
import { PackageListItem } from '../../models/package';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

@Component({
  selector: 'app-admin-package-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-package-list.html',
  styleUrl: './admin-package-list.scss',
})
export class AdminPackageList implements OnInit {
  private pkg = inject(Package);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<PackageListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  private search = '';
  /** `naziv`/`cena`/`najbolji`/`aktivan` are plain scalar columns (name,
   * totalPrice, isBest, isActive) on the Package schema - see
   * PACKAGE_SORT_FIELDS in admin-catalog.controller.js. `stavke` (populated
   * item names, joined) is NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** packageRepo.findPackages's default sort ({ order: 1, createdAt: -1, _id: -1 })
   * is primarily the manual `order` field, which has no column in this list -
   * no defaultSort indicator is shown, same reasoning as admin-user-list. */

  columns: DataTableColumn<PackageListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'stavke', label: 'Stavke', value: (row) => row.stavke.join(', ') },
    { key: 'cena', label: 'Cena', sortable: true },
    { key: 'najbolji', label: 'Najbolji', sortable: true },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
  ];

  actions: DataTableAction<PackageListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/paketi', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/paketi', row.id, 'izmena']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati paket?', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.pkg
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
          this.error.set(error?.message || 'Greška pri učitavanju paketa.');
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

  remove(row: PackageListItem): void {
    this.pkg.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Paket je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
