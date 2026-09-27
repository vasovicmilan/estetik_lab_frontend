import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { User } from '../../services/user';
import { UserAdminListItem, UserStatus } from '../../models/user';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/korisnici. Paginated, same MatPaginatorModule/
 * PageEvent pattern as admin-order-list.ts. search/status are the only filters
 * the backend's listUsers actually reads (plus role/provider, not exposed
 * here - no role-name filter UI in this pass, keep it simple). */
@Component({
  selector: 'app-admin-user-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ImageUrlPipe,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-user-list.html',
  styleUrl: './admin-user-list.scss',
})
export class AdminUserList implements OnInit {
  private user = inject(User);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<UserAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `email`/`status`/`poslednjiLogin` are plain scalar columns (email, status,
   * lastLogin) on the User schema - see USER_SORT_FIELDS in
   * admin-people.controller.js. `imePrezime` (concatenated firstName+lastName)
   * and `uloga` (populated role name) are NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ createdAt: -1, _id: -1 }` in
   * user.repository.js/findUsers) - no column here maps to createdAt, so no
   * defaultSort indicator is shown (see below). */

  columns: DataTableColumn<UserAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'imePrezime', label: 'Ime i prezime' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'uloga', label: 'Uloga' },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'poslednjiLogin', label: 'Poslednja prijava', sortable: true },
  ];

  actions: DataTableAction<UserAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/korisnici', row.id]) },
  ];

  statusOptions: { value: '' | UserStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'guest', label: 'Gost' },
    { value: 'pending', label: 'Na čekanju' },
    { value: 'active', label: 'Aktivan' },
    { value: 'inactive', label: 'Neaktivan' },
    { value: 'suspended', label: 'Suspendovan' },
  ];

  filterForm = this.fb.group({
    search: [''],
    status: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, status } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.user
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
        status: status || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju korisnika.');
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

  statusClass(statusRaw: UserStatus): string {
    return `admin-user-list__status admin-user-list__status--${statusRaw}`;
  }
}
