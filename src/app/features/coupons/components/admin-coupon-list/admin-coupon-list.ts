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
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Coupon } from '../../services/coupon';
import { CouponAdminListItem } from '../../models/coupon';
import { ApiMeta } from '../../../../core/models/api-response';

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
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-coupon-list.html',
  styleUrl: './admin-coupon-list.scss',
})
export class AdminCouponList implements OnInit {
  private coupon = inject(Coupon);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['kod', 'tip', 'popust', 'maxUpotreba', 'iskorisceno', 'aktivnost', 'vaziDo', 'akcije'];
  rows = signal<CouponAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  filterForm = this.fb.group({
    search: [''],
    isActive: [''],
  });

  activeOptions: { value: '' | 'true' | 'false'; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'true', label: 'Aktivni' },
    { value: 'false', label: 'Neaktivni' },
  ];

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, isActive } = this.filterForm.value;

    this.loading.set(true);
    this.coupon
      .listAdmin({
        page,
        limit: 10,
        search: search || undefined,
        isActive: isActive || undefined,
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

  remove(row: CouponAdminListItem): void {
    if (!confirm(`Obrisati kupon "${row.kod}"?`)) return;

    this.coupon.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Kupon je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
