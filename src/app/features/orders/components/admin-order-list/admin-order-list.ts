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
import { Order } from '../../services/order';
import { OrderAdminListItem, OrderStatus } from '../../models/order';
import { ApiMeta } from '../../../../core/models/api-response';

/** List + filter bar for admin/porudzbine. Paginated, same MatPaginatorModule/
 * PageEvent pattern as admin-appointment-list.ts. */
@Component({
  selector: 'app-admin-order-list',
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
  templateUrl: './admin-order-list.html',
  styleUrl: './admin-order-list.scss',
})
export class AdminOrderList implements OnInit {
  private order = inject(Order);
  private fb = inject(FormBuilder);

  displayedColumns = ['korisnik', 'brojStavki', 'datum', 'status', 'ukupnaCena', 'akcije'];
  rows = signal<OrderAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  statusOptions: { value: '' | OrderStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'pending', label: 'Na čekanju' },
    { value: 'processing', label: 'U obradi' },
    { value: 'shipped', label: 'Poslato' },
    { value: 'delivered', label: 'Dostavljeno' },
    { value: 'completed', label: 'Završeno' },
    { value: 'cancelled', label: 'Otkazano' },
    { value: 'returned', label: 'Vraćeno' },
    { value: 'refunded', label: 'Refundirano' },
  ];

  filterForm = this.fb.group({
    search: [''],
    status: [''],
    dateFrom: [''],
    dateTo: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, status, dateFrom, dateTo } = this.filterForm.value;

    this.loading.set(true);
    this.order
      .listAdmin({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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

  statusClass(statusRaw: OrderStatus): string {
    return `admin-order-list__status admin-order-list__status--${statusRaw}`;
  }
}
