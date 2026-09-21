import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Employee } from '../../services/employee';
import { EmployeeAdminListItem } from '../../models/employee';
import { ApiMeta } from '../../../../core/models/api-response';

/** Mirrors admin-resource-list/admin-order-list's load/paginate/delete pattern. */
@Component({
  selector: 'app-admin-employee-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-employee-list.html',
  styleUrl: './admin-employee-list.scss',
})
export class AdminEmployeeList implements OnInit {
  private employee = inject(Employee);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['imePrezime', 'email', 'brojUsluga', 'aktivan', 'kreiran', 'akcije'];
  rows = signal<EmployeeAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.employee.listAdmin({ page, limit: 10 }).subscribe({
      next: ({ data, meta }) => {
        this.rows.set(data);
        this.meta.set(meta ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.load(event.pageIndex + 1);
  }

  remove(row: EmployeeAdminListItem): void {
    if (!confirm(`Obrisati zaposlenog "${row.imePrezime}"?`)) return;

    this.employee.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Zaposleni je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
