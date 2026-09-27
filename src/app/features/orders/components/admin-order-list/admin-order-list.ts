import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { Order } from '../../services/order';
import { OrderAdminListItem, OrderStatus } from '../../models/order';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/porudzbine. Paginated, same MatPaginatorModule/
 * PageEvent pattern as admin-appointment-list.ts. */
@Component({
  selector: 'app-admin-order-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-order-list.html',
  styleUrl: './admin-order-list.scss',
})
export class AdminOrderList implements OnInit {
  private order = inject(Order);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<OrderAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `datum`/`status`/`ukupnaCena` are plain scalar columns (createdAt, status,
   * totalPrice) on the Order schema - see ORDER_SORT_FIELDS in
   * admin-order.controller.js. `korisnik` (populated user name) and `brojStavki`
   * (items.length, computed in JS) are NOT sortable. */
  private sort: string | null = null;
  private sortOrder: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ createdAt: -1, _id: -1 }` in
   * order.repository.js/findOrders). */
  defaultSort = { active: 'datum', direction: 'desc' as const };

  columns: DataTableColumn<OrderAdminListItem>[] = [
    { key: 'korisnik', label: 'Klijent' },
    { key: 'brojStavki', label: 'Broj stavki' },
    { key: 'datum', label: 'Datum', sortable: true },
    { key: 'status', label: 'Status', type: 'custom' },
    { key: 'ukupnaCena', label: 'Ukupno', sortable: true },
  ];

  actions: DataTableAction<OrderAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/porudzbine', row.id]) },
  ];

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
    this.error.set(null);
    this.order
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sort: this.sort ?? undefined,
        order: this.sortOrder ?? undefined,
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju porudžbina.');
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
    this.sortOrder = sort.direction ? (sort.direction as 'asc' | 'desc') : null;
    this.load(1);
  }

  statusClass(statusRaw: OrderStatus): string {
    return `admin-order-list__status admin-order-list__status--${statusRaw}`;
  }
}
