import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../services/role';
import { RESERVED_ROLE_NAMES, RoleAdminListItem } from '../../models/role';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Same load/paginate/delete/error-state pattern as admin-product-list (see
 * that component's recent error+empty state pass) - reused here rather than
 * admin-tag-list's older version, which has neither. */
@Component({
  selector: 'app-admin-role-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-role-list.html',
  styleUrl: './admin-role-list.scss',
})
export class AdminRoleList implements OnInit {
  private role = inject(Role);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  rows = signal<RoleAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  private search = '';
  /** `naziv`/`opis`/`podrazumevana`/`prioritet` are plain scalar columns (name,
   * description, isDefault, priority) on the Role schema - see
   * ROLE_SORT_FIELDS in admin-taxonomy.controller.js. `brojPermisija`
   * (permissions.length, computed in JS) is NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ priority: -1, name: 1, _id: -1 }`
   * in role.repository.js/findRoles) - `prioritet` is the leading key. */
  defaultSort = { active: 'prioritet', direction: 'desc' as const };

  columns: DataTableColumn<RoleAdminListItem>[] = [
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'opis', label: 'Opis', value: (row) => row.opis || '-' },
    { key: 'brojPermisija', label: 'Broj permisija' },
    { key: 'podrazumevana', label: 'Podrazumevana', sortable: true },
    { key: 'prioritet', label: 'Prioritet', sortable: true },
  ];

  actions: DataTableAction<RoleAdminListItem>[] = [
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/role', row.id, 'izmena']) },
    {
      icon: 'delete',
      label: 'Obriši',
      color: 'warn',
      visible: (row) => !this.isReserved(row),
      onClick: (row) => this.remove(row),
    },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.role
      .listAdmin({ page, limit: this.limit, search: this.search || undefined, sort: this.sort ?? undefined, order: this.order ?? undefined })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju rola.');
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

  /** Reserved roles (admin/employee/user) can't be deleted - the backend
   * refuses with a 400 anyway (deleteRoleById), but hiding the action avoids a
   * pointless round trip and a confusing error. */
  isReserved(row: RoleAdminListItem): boolean {
    return RESERVED_ROLE_NAMES.includes(row.naziv);
  }

  remove(row: RoleAdminListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati rolu "${row.naziv}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.role.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Rola je obrisana.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
