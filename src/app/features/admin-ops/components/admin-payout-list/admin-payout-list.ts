import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { AdminPayoutRequest } from '../../services/payout-request';
import { PayoutRequestAdminListItem, PayoutStatusRaw } from '../../models/payout-request';
import { ApiMeta } from '../../../../core/models/api-response';

/** Mirrors admin-partner-list's filter-bar/paginate pattern. Mounted at
 * /admin/isplate (see payouts.routes.ts). */
@Component({
  selector: 'app-admin-payout-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-payout-list.html',
  styleUrl: './admin-payout-list.scss',
})
export class AdminPayoutList implements OnInit {
  private payoutRequest = inject(AdminPayoutRequest);
  private fb = inject(FormBuilder);

  displayedColumns = ['earnerType', 'earnerName', 'iznos', 'status', 'zatrazeno', 'akcije'];
  rows = signal<PayoutRequestAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.payoutRequest
      .listAdmin({
        page,
        limit: 10,
        status: status || undefined,
        earnerType: earnerType || undefined,
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
}
