import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../services/role';
import { RESERVED_ROLE_NAMES, RoleAdminListItem } from '../../models/role';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';

/** Same load/paginate/delete/error-state pattern as admin-product-list (see
 * that component's recent error+empty state pass) - reused here rather than
 * admin-tag-list's older version, which has neither. */
@Component({
  selector: 'app-admin-role-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-role-list.html',
  styleUrl: './admin-role-list.scss',
})
export class AdminRoleList implements OnInit {
  private role = inject(Role);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  displayedColumns = ['naziv', 'opis', 'brojPermisija', 'podrazumevana', 'prioritet', 'akcije'];
  rows = signal<RoleAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.role.listAdmin({ page, limit: 10 }).subscribe({
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
    this.load(event.pageIndex + 1);
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
