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
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Coupon } from '../../services/coupon';
import { CouponAdminListItem } from '../../models/coupon';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** List + filter bar for admin/kuponi. Paginated, same debounced-search +
 * MatPaginatorModule/PageEvent pattern as admin-order-list.ts. `isActive` filter
 * is a tri-state select (Svi/Aktivni/Neaktivni) - omitted from the request
 * entirely for "Svi" so the backend returns every coupon regardless of status. */
@Component({
  selector: 'app-admin-coupon-list',
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
  templateUrl: './admin-coupon-list.html',
  styleUrl: './admin-coupon-list.scss',
})
export class AdminCouponList implements OnInit {
  private coupon = inject(Coupon);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<CouponAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `kod`/`tip`/`maxUpotreba`/`iskorisceno`/`aktivnost`/`vaziDo` are plain
   * scalar columns (code, discountType, maxUses, usedCount, isActive,
   * validUntil) on the Coupon schema - see COUPON_SORT_FIELDS in
   * admin-marketing.controller.js. `popust` (discount formatted across
   * discountType+discountValue) is NOT sortable - a concatenated display
   * string, not a scalar column. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** couponRepo.findCoupons's default ({ createdAt: -1, _id: -1 }) has no
   * matching column shown in this list (kreiran/createdAt isn't a displayed
   * column here), so no defaultSort indicator is shown, same reasoning as
   * admin-user-list. */

  columns: DataTableColumn<CouponAdminListItem>[] = [
    { key: 'kod', label: 'Kod', sortable: true },
    { key: 'tip', label: 'Tip', sortable: true },
    { key: 'popust', label: 'Popust' },
    { key: 'maxUpotreba', label: 'Max upotreba', sortable: true },
    { key: 'iskorisceno', label: 'Iskorišćeno', sortable: true },
    { key: 'aktivnost', label: 'Status', sortable: true },
    { key: 'vaziDo', label: 'Važi do', sortable: true },
  ];

  actions: DataTableAction<CouponAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/kuponi', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/kuponi', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati kupon?', onClick: (row) => this.remove(row) },
  ];

  activeOptions: { value: '' | 'true' | 'false'; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'true', label: 'Aktivni' },
    { value: 'false', label: 'Neaktivni' },
  ];

  filterForm = this.fb.group({
    search: [''],
    isActive: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, isActive } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.coupon
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
        isActive: isActive || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju kupona.');
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

  remove(row: CouponAdminListItem): void {
    this.coupon.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Kupon je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
