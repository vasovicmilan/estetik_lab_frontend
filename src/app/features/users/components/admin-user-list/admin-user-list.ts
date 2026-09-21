import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { User } from '../../services/user';
import { UserAdminListItem, UserStatus } from '../../models/user';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** List + filter bar for admin/korisnici. Paginated, same MatPaginatorModule/
 * PageEvent pattern as admin-order-list.ts. search/status are the only filters
 * the backend's listUsers actually reads (plus role/provider, not exposed
 * here - no role-name filter UI in this pass, keep it simple). */
@Component({
  selector: 'app-admin-user-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-user-list.html',
  styleUrl: './admin-user-list.scss',
})
export class AdminUserList implements OnInit {
  private user = inject(User);
  private fb = inject(FormBuilder);

  displayedColumns = ['slika', 'imePrezime', 'email', 'uloga', 'status', 'poslednjiLogin', 'akcije'];
  rows = signal<UserAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.user
      .listAdmin({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      })
      .subscribe({
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

  statusClass(statusRaw: UserStatus): string {
    return `admin-user-list__status admin-user-list__status--${statusRaw}`;
  }
}
