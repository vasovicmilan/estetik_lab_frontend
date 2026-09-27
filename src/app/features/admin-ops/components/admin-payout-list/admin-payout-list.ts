import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { AdminPayoutRequest } from '../../services/payout-request';
import { PayoutRequestAdminListItem, PayoutStatusRaw } from '../../models/payout-request';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Mirrors admin-partner-list's filter-bar/paginate pattern. Mounted at
 * /admin/isplate (see payouts.routes.ts). */
@Component({
  selector: 'app-admin-payout-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, DataTable],
  templateUrl: './admin-payout-list.html',
  styleUrl: './admin-payout-list.scss',
})
export class AdminPayoutList implements OnInit {
  private payoutRequest = inject(AdminPayoutRequest);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<PayoutRequestAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `earnerType`/`iznos`/`status`/`zatrazeno` are plain scalar columns
   * (earnerType, amount, status, requestedAt) on the PayoutRequest schema -
   * see PAYOUT_SORT_FIELDS in admin-ops.controller.js. `earnerName` (resolved
   * from employeeSnapshot or a populated employee/partner->userId name) is NOT
   * sortable - not a scalar column a repository can sort on directly. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** payoutRepo.findPayoutRequests's default ({ createdAt: -1, _id: -1 }) has
   * no exactly-matching displayed column - `zatrazeno` maps to `requestedAt`,
   * a different field than the backend's actual default sort key - so no
   * defaultSort indicator is shown, same reasoning as admin-user-list. */

  columns: DataTableColumn<PayoutRequestAdminListItem>[] = [
    { key: 'earnerType', label: 'Tip', sortable: true },
    { key: 'earnerName', label: 'Zarađivač' },
    { key: 'iznos', label: 'Iznos', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'zatrazeno', label: 'Zatraženo', sortable: true },
  ];

  actions: DataTableAction<PayoutRequestAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/isplate', row.id]) },
  ];

  statusOptions: { value: '' | PayoutStatusRaw; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'requested', label: 'Zatraženo' },
    { value: 'approved', label: 'Odobreno' },
    { value: 'paid', label: 'Isplaćeno' },
    { value: 'rejected', label: 'Odbijeno' },
  ];

  earnerTypeOptions: { value: '' | 'employee' | 'partner'; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'employee', label: 'Zaposleni' },
    { value: 'partner', label: 'Partner' },
  ];

  filterForm = this.fb.group({
    status: [''],
    earnerType: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { status, earnerType } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.payoutRequest
      .listAdmin({
        page,
        limit: this.limit,
        status: status || undefined,
        earnerType: earnerType || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju zahteva za isplatu.');
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
