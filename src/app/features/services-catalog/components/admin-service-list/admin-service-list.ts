import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Service } from '../../services/service';
import { ServiceListItem } from '../../models/service';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

@Component({
  selector: 'app-admin-service-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-service-list.html',
  styleUrl: './admin-service-list.scss',
})
export class AdminServiceList implements OnInit {
  private service = inject(Service);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  rows = signal<ServiceListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `naziv`/`aktivna` are plain scalar columns (name, isActive) on the Service
   * schema - see SERVICE_SORT_FIELDS in admin-catalog.controller.js.
   * `kategorije` (populated category names) and `brojVarijanti`
   * (packages.length, computed in JS) are NOT sortable. No defaultSort is set:
   * the backend's true default (`{ highlight: -1, createdAt: -1, _id: -1 }`)
   * has no column shown here, so no sortable column can truthfully claim it. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  columns: DataTableColumn<ServiceListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'kategorije', label: 'Kategorije', value: (row) => row.kategorije.join(', ') },
    { key: 'brojVarijanti', label: 'Varijante' },
    { key: 'aktivna', label: 'Aktivna', sortable: true },
  ];

  actions: DataTableAction<ServiceListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/usluge', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/usluge', row.id, 'izmena']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listAdmin({ page, limit: this.limit, sort: this.sort ?? undefined, order: this.order ?? undefined })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju usluga.');
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

  remove(row: ServiceListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati uslugu "${row.naziv}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Usluga je obrisana.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
