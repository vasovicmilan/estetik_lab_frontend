import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { TemporaryOrder } from '../../services/temporary-order';
import { TemporaryOrderAdminListItem } from '../../models/temporary-order';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + search bar for admin/privremene-porudzbine. Paginated, same
 * debounced-search + MatPaginatorModule/PageEvent pattern as admin-order-list.ts.
 * No status filter (temporary orders have no status field), no create/edit route -
 * see temporary-orders.routes.ts's header comment. */
@Component({
  selector: 'app-admin-temporary-order-list',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, DataTable, DataTableCellDef],
  templateUrl: './admin-temporary-order-list.html',
  styleUrl: './admin-temporary-order-list.scss',
})
export class AdminTemporaryOrderList implements OnInit {
  private temporaryOrder = inject(TemporaryOrder);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<TemporaryOrderAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `email`/`ukupnaCena`/`zahtevaProceenuDostave`/`istice`/`kreirano` map to
   * plain scalar columns (contactSnapshot.email, totalPrice,
   * requiresShippingQuote, tokenExpiration, createdAt) on the TemporaryOrder
   * schema - see TEMP_ORDER_SORT_FIELDS in admin-order.controller.js.
   * `korisnik` (contactSnapshot firstName+lastName, concatenated) is NOT
   * sortable - not a scalar column a repository can sort on directly. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches tempOrderRepo.findTemporaryOrders's own default
   * ({ createdAt: -1, _id: -1 }). */
  defaultSort = { active: 'kreirano', direction: 'desc' as const };

  columns: DataTableColumn<TemporaryOrderAdminListItem>[] = [
    { key: 'korisnik', label: 'Klijent' },
    { key: 'email', label: 'Email', value: (row) => row.email ?? '-', sortable: true },
    { key: 'ukupnaCena', label: 'Ukupno', sortable: true },
    { key: 'zahtevaProceenuDostave', label: 'Procena dostave', type: 'custom', sortable: true },
    { key: 'istice', label: 'Ističe', sortable: true },
    { key: 'kreirano', label: 'Kreirano', sortable: true },
  ];

  actions: DataTableAction<TemporaryOrderAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/privremene-porudzbine', row.id, 'pregled']) },
  ];

  filterForm = this.fb.group({
    search: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.temporaryOrder
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju privremenih porudžbina.');
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
