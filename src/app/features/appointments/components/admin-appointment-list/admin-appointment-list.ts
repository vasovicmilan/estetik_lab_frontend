import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { Appointment } from '../../services/appointment';
import { AppointmentAdminListItem, AppointmentStatus } from '../../models/appointment';
import { ApiMeta } from '../../../../core/models/api-response';

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
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-appointment-list.html',
  styleUrl: './admin-appointment-list.scss',
})
export class AdminAppointmentList implements OnInit {
  private appointment = inject(Appointment);
  private fb = inject(FormBuilder);

  displayedColumns = ['korisnik', 'usluga', 'datum', 'status', 'konacnaCena', 'akcije'];
  rows = signal<AppointmentAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.appointment
      .listAdmin({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        unassignedOnly: unassignedOnly || undefined,
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

  statusClass(statusRaw: AppointmentStatus): string {
    return `admin-appointment-list__status admin-appointment-list__status--${statusRaw}`;
  }
}
