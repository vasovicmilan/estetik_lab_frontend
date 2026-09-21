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
import { Testimonial } from '../../services/testimonial';
import { TestimonialAdminListItem, TestimonialStatus } from '../../models/testimonial';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** List + filter bar for admin/utisci. Paginated, same debounced-filter +
 * MatPaginatorModule/PageEvent pattern as admin-coupon-list.ts. Defaults to the
 * `pending` status filter on first load so new submissions needing a review
 * decision are front and center, rather than buried under already-reviewed
 * ones - the admin switches to "Svi"/"Odobreni"/"Odbijeni" explicitly to see
 * the rest. `isFeatured` is a separate, optional tri-state filter. */
@Component({
  selector: 'app-admin-testimonial-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-testimonial-list.html',
  styleUrl: './admin-testimonial-list.scss',
})
export class AdminTestimonialList implements OnInit {
  private testimonial = inject(Testimonial);
  private fb = inject(FormBuilder);

  displayedColumns = ['slika', 'ime', 'ocena', 'komentar', 'usluga', 'status', 'istaknut', 'kreiran', 'akcije'];
  rows = signal<TestimonialAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.testimonial
      .listAdmin({
        page,
        limit: 10,
        status: status || undefined,
        isFeatured: isFeatured || undefined,
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

  statusClass(statusRaw: TestimonialStatus): string {
    return `admin-testimonial-list__status admin-testimonial-list__status--${statusRaw}`;
  }
}
