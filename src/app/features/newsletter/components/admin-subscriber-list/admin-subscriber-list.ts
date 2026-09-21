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
import { Subscriber } from '../../services/subscriber';
import { SubscriberAdminListItem, SubscriberStatus } from '../../models/subscriber';
import { ApiMeta } from '../../../../core/models/api-response';

/** List + filter bar for admin/pretplatnici. Paginated, same debounced-search +
 * MatPaginatorModule/PageEvent pattern as admin-coupon-list.ts. No "novi" route -
 * subscribers sign themselves up publicly, admin can only view/delete here. */
@Component({
  selector: 'app-admin-subscriber-list',
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
  templateUrl: './admin-subscriber-list.html',
  styleUrl: './admin-subscriber-list.scss',
})
export class AdminSubscriberList implements OnInit {
  private subscriber = inject(Subscriber);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['email', 'status', 'interesovanja', 'prijavljen', 'akcije'];
  rows = signal<SubscriberAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  statusOptions: { value: '' | SubscriberStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'subscribed', label: 'Prijavljeni' },
    { value: 'unsubscribed', label: 'Odjavljeni' },
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
    this.subscriber
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

  remove(row: SubscriberAdminListItem): void {
    if (!confirm(`Obrisati pretplatnika "${row.email}"?`)) return;

    this.subscriber.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Pretplatnik je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
