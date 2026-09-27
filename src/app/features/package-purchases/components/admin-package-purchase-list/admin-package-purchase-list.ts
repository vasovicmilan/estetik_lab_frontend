import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { PackagePurchase } from '../../services/package-purchase';
import { PackagePurchaseAdminListItem, PackagePurchaseStatus } from '../../models/package-purchase';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** List + filter bar for admin/kupljeni-paketi. Same paginated,
 * debounced-filter, MatPaginatorModule/PageEvent pattern as admin-coupon-list.
 *
 * The list-row shape (GET /admin/package-purchases) has no user/buyer name
 * field - only the detail shape does - so instead of a displayed "korisnik"
 * column this filters by a plain `userId` text box (the endpoint accepts it as
 * a query param). Keeping this simple rather than resolving names client-side
 * for every row. */
@Component({
  selector: 'app-admin-package-purchase-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DataTable,
  ],
  templateUrl: './admin-package-purchase-list.html',
  styleUrl: './admin-package-purchase-list.scss',
})
export class AdminPackagePurchaseList implements OnInit {
  private packagePurchase = inject(PackagePurchase);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<PackagePurchaseAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `cena`/`status`/`kupljeno`/`istice` are plain scalar columns (pricePaid,
   * status, purchasedAt, expiresAt) on the PackagePurchase schema - see
   * PACKAGE_PURCHASE_SORT_FIELDS in admin-package-purchase.controller.js.
   * `paket` (populated Package name) is NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default ({ purchasedAt: -1, _id: -1 } in
   * package-purchase.repository.js/findPackagePurchases). */
  defaultSort = { active: 'kupljeno', direction: 'desc' as const };

  columns: DataTableColumn<PackagePurchaseAdminListItem>[] = [
    { key: 'paket', label: 'Paket' },
    { key: 'cena', label: 'Cena', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'kupljeno', label: 'Kupljeno', sortable: true },
    { key: 'istice', label: 'Ističe', sortable: true },
  ];

  actions: DataTableAction<PackagePurchaseAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/kupljeni-paketi', row.id, 'pregled']) },
  ];

  filterForm = this.fb.group({
    userId: [''],
    status: [''],
  });

  statusOptions: { value: '' | PackagePurchaseStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'active', label: 'Aktivan' },
    { value: 'completed', label: 'Iskorišćen' },
    { value: 'expired', label: 'Istekao' },
    { value: 'cancelled', label: 'Otkazan' },
  ];

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { userId, status } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.packagePurchase
      .list({
        page,
        limit: this.limit,
        userId: userId || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju kupljenih paketa.');
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
}
