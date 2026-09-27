import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Tag } from '../../services/tag';
import { TagAdminListItem } from '../../models/tag';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Mirrors services-catalog's admin-service-list - see that component's header
 * for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-tag-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-tag-list.html',
  styleUrl: './admin-tag-list.scss',
})
export class AdminTagList implements OnInit {
  private tag = inject(Tag);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  rows = signal<TagAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `naziv`/`domen`/`aktivan` are plain scalar columns (name, domain, isActive)
   * on the Tag schema - see TAG_SORT_FIELDS in admin-taxonomy.controller.js. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ name: 1, _id: -1 }` in
   * tag.repository.js/findTags). */
  defaultSort = { active: 'naziv', direction: 'asc' as const };

  columns: DataTableColumn<TagAdminListItem>[] = [
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'domen', label: 'Domen', sortable: true },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
  ];

  actions: DataTableAction<TagAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/tagovi', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/tagovi', row.id, 'izmena']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.tag
      .listAdmin({ page, limit: this.limit, sort: this.sort ?? undefined, order: this.order ?? undefined })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju tagova.');
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

  remove(row: TagAdminListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati tag "${row.naziv}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.tag.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Tag je obrisan.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
