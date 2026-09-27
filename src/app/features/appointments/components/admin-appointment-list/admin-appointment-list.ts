import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { debounceTime } from 'rxjs';
import { Appointment } from '../../services/appointment';
import { AppointmentAdminListItem, AppointmentStatus } from '../../models/appointment';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/zakazivanja. Paginated (unlike most other admin
 * lists so far, which stayed non-paginated because they only ever had ~20 rows) -
 * appointments accumulate over time, so this one uses the same
 * MatPaginatorModule/PageEvent pattern as admin-service-list.ts. */
@Component({
  selector: 'app-admin-appointment-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-appointment-list.html',
  styleUrl: './admin-appointment-list.scss',
})
export class AdminAppointmentList implements OnInit {
  private appointment = inject(Appointment);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<AppointmentAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `datum`/`status`/`konacnaCena` are plain scalar columns (startTime, status,
   * finalPrice) on the Appointment schema - see APPOINTMENT_SORT_FIELDS in
   * admin-appointment.controller.js. `korisnik`/`usluga` are NOT sortable: they're
   * populated ref display names, not columns on Appointment itself. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default (`{ startTime: -1, _id: -1 }` in
   * appointment.repository.js/findAppointments). */
  defaultSort = { active: 'datum', direction: 'desc' as const };

  columns: DataTableColumn<AppointmentAdminListItem>[] = [
    { key: 'korisnik', label: 'Klijent' },
    { key: 'usluga', label: 'Usluga' },
    { key: 'datum', label: 'Termin', sortable: true },
    {
      key: 'status',
      label: 'Status',
      type: 'custom',
    },
    { key: 'konacnaCena', label: 'Cena', sortable: true },
  ];

  actions: DataTableAction<AppointmentAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/zakazivanja', row.id]) },
  ];

  statusOptions: { value: '' | AppointmentStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'pending', label: 'Na čekanju' },
    { value: 'confirmed', label: 'Potvrđen' },
    { value: 'rejected', label: 'Odbijen' },
    { value: 'cancelled', label: 'Otkazan' },
    { value: 'completed', label: 'Završen' },
    { value: 'no_show', label: 'Nije se pojavio/la' },
  ];

  filterForm = this.fb.group({
    search: [''],
    status: [''],
    dateFrom: [''],
    dateTo: [''],
    unassignedOnly: [false],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, status, dateFrom, dateTo, unassignedOnly } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.appointment
      .listAdmin({
        page,
        limit: this.limit,
        search: search || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        unassignedOnly: unassignedOnly || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju zakazivanja.');
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

  statusClass(statusRaw: AppointmentStatus): string {
    return `admin-appointment-list__status admin-appointment-list__status--${statusRaw}`;
  }
}
