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
import { PackagePurchase } from '../../services/package-purchase';
import { PackagePurchaseAdminListItem, PackagePurchaseStatus } from '../../models/package-purchase';
import { ApiMeta } from '../../../../core/models/api-response';

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
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-package-purchase-list.html',
  styleUrl: './admin-package-purchase-list.scss',
})
export class AdminPackagePurchaseList implements OnInit {
  private packagePurchase = inject(PackagePurchase);
  private fb = inject(FormBuilder);

  displayedColumns = ['paket', 'cena', 'status', 'kupljeno', 'istice', 'akcije'];
  rows = signal<PackagePurchaseAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.packagePurchase
      .list({
        page,
        limit: 10,
        userId: userId || undefined,
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
}
