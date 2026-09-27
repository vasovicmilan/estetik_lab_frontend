import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Subscriber } from '../../services/subscriber';
import { SubscriberAdminListItem, SubscriberStatus } from '../../models/subscriber';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/pretplatnici. Paginated, same debounced-search +
 * MatPaginatorModule/PageEvent pattern as admin-coupon-list.ts. No "novi" route -
 * subscribers sign themselves up publicly, admin can only view/delete here. */
@Component({
  selector: 'app-admin-subscriber-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-subscriber-list.html',
  styleUrl: './admin-subscriber-list.scss',
})
export class AdminSubscriberList implements OnInit {
  private subscriber = inject(Subscriber);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<SubscriberAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `email`/`status`/`prijavljen` are plain scalar columns (email, status,
   * subscribedAt) on the NewsLetter schema - see SUBSCRIBER_SORT_FIELDS in
   * admin-marketing.controller.js. `interesovanja` (formatted from
   * interests[]) is NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** findSubscribers's default sort is createdAt - `prijavljen` (subscribedAt)
   * is a different field that can be bumped independently on re-subscribe, so
   * no column here genuinely matches that default - no defaultSort indicator
   * is shown, same reasoning as admin-user-list. */

  columns: DataTableColumn<SubscriberAdminListItem>[] = [
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'interesovanja', label: 'Interesovanja', value: (row) => (row.interesovanja.length ? row.interesovanja.join(', ') : '-') },
    { key: 'prijavljen', label: 'Prijavljen', sortable: true },
  ];

  actions: DataTableAction<SubscriberAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/pretplatnici', row.id, 'pregled']) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati pretplatnika?', onClick: (row) => this.remove(row) },
  ];

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
    this.error.set(null);
    this.subscriber
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
        status: status || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju pretplatnika.');
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

  remove(row: SubscriberAdminListItem): void {
    this.subscriber.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Pretplatnik je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
