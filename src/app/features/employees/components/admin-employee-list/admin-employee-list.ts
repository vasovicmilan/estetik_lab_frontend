import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Employee } from '../../services/employee';
import { EmployeeAdminListItem } from '../../models/employee';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Mirrors admin-resource-list/admin-order-list's load/paginate/delete pattern. */
@Component({
  selector: 'app-admin-employee-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-employee-list.html',
  styleUrl: './admin-employee-list.scss',
})
export class AdminEmployeeList implements OnInit {
  private employee = inject(Employee);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  rows = signal<EmployeeAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `aktivan`/`kreiran` are plain scalar columns (isActive, createdAt) on the
   * Employee schema - see EMPLOYEE_SORT_FIELDS in admin-people.controller.js.
   * `imePrezime`/`email` (populated userId names) and `brojUsluga`
   * (services.length, computed in JS) are NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ createdAt: -1, _id: -1 }` in
   * employee.repository.js/findEmployees). */
  defaultSort = { active: 'kreiran', direction: 'desc' as const };

  columns: DataTableColumn<EmployeeAdminListItem>[] = [
    { key: 'imePrezime', label: 'Ime i prezime' },
    { key: 'email', label: 'Email', value: (row) => row.email ?? '-' },
    { key: 'brojUsluga', label: 'Broj usluga' },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
    { key: 'kreiran', label: 'Kreiran', sortable: true },
  ];

  actions: DataTableAction<EmployeeAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/zaposleni', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/zaposleni', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.employee
      .listAdmin({ page, limit: this.limit, sort: this.sort ?? undefined, order: this.order ?? undefined })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju zaposlenih.');
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

  remove(row: EmployeeAdminListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati zaposlenog "${row.imePrezime}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.employee.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Zaposleni je obrisan.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
