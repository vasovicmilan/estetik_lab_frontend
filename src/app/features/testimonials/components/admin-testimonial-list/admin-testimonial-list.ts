import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { Testimonial } from '../../services/testimonial';
import { TestimonialAdminListItem, TestimonialStatus } from '../../models/testimonial';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/utisci. Paginated, same debounced-filter +
 * MatPaginatorModule/PageEvent pattern as admin-coupon-list.ts. Defaults to the
 * `pending` status filter on first load so new submissions needing a review
 * decision are front and center, rather than buried under already-reviewed
 * ones - the admin switches to "Svi"/"Odobreni"/"Odbijeni" explicitly to see
 * the rest. `isFeatured` is a separate, optional tri-state filter. */
@Component({
  selector: 'app-admin-testimonial-list',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-testimonial-list.html',
  styleUrl: './admin-testimonial-list.scss',
})
export class AdminTestimonialList implements OnInit {
  private testimonial = inject(Testimonial);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<TestimonialAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `ime`/`ocena`/`komentar`/`status`/`istaknut`/`kreiran` map to plain scalar
   * columns (name, rating, message, status, isFeatured, createdAt) on the
   * Testimonial schema - see TESTIMONIAL_SORT_FIELDS in
   * admin-marketing.controller.js. `usluga` (the linked service/package/
   * product's populated name) is NOT sortable - not a scalar column a
   * repository can sort on directly. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** testimonialRepo.findTestimonials's default ({ isFeatured: -1, createdAt: -1,
   * _id: -1 }) is a compound sort no single displayed column maps to on its own,
   * so no defaultSort indicator is shown, same reasoning as admin-user-list. */

  columns: DataTableColumn<TestimonialAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'ime', label: 'Ime', sortable: true },
    { key: 'ocena', label: 'Ocena', sortable: true },
    { key: 'komentar', label: 'Komentar', sortable: true },
    { key: 'usluga', label: 'Usluga', value: (row) => row.usluga || '-' },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'istaknut', label: 'Istaknut', sortable: true },
    { key: 'kreiran', label: 'Kreiran', sortable: true },
  ];

  actions: DataTableAction<TestimonialAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/utisci', row.id, 'pregled']) },
  ];

  statusOptions: { value: '' | TestimonialStatus; label: string }[] = [
    { value: 'pending', label: 'Na čekanju' },
    { value: 'approved', label: 'Odobreni' },
    { value: 'rejected', label: 'Odbijeni' },
    { value: '', label: 'Svi' },
  ];

  featuredOptions: { value: '' | 'true' | 'false'; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'true', label: 'Istaknuti' },
    { value: 'false', label: 'Neistaknuti' },
  ];

  filterForm = this.fb.group({
    status: ['pending' as '' | TestimonialStatus],
    isFeatured: ['' as '' | 'true' | 'false'],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { status, isFeatured } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.testimonial
      .listAdmin({
        page,
        limit: this.limit,
        status: status || undefined,
        isFeatured: isFeatured || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju utisaka.');
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

  statusClass(statusRaw: TestimonialStatus): string {
    return `admin-testimonial-list__status admin-testimonial-list__status--${statusRaw}`;
  }
}
