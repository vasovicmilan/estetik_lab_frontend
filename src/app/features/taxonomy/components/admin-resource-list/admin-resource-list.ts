import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Resource } from '../../services/resource';
import { ResourceAdminListItem } from '../../models/resource';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Mirrors services-catalog's admin-service-list - see that component's header
 * for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-resource-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-resource-list.html',
  styleUrl: './admin-resource-list.scss',
})
export class AdminResourceList implements OnInit {
  private resource = inject(Resource);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<ResourceAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  private search = '';
  /** `naziv`/`kapacitet`/`aktivan` are plain scalar columns (name, capacity,
   * isActive) on the Resource schema - see RESOURCE_SORT_FIELDS in
   * admin-taxonomy.controller.js. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches resourceRepo.findResources's own default ({ name: 1, _id: -1 }). */
  defaultSort = { active: 'naziv', direction: 'asc' as const };

  columns: DataTableColumn<ResourceAdminListItem>[] = [
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'kapacitet', label: 'Kapacitet', sortable: true },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
  ];

  actions: DataTableAction<ResourceAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/resursi', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/resursi', row.id, 'izmena']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati resurs?', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.resource
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
          this.error.set(error?.message || 'Greška pri učitavanju resursa.');
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

  remove(row: ResourceAdminListItem): void {
    this.resource.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Resurs je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
