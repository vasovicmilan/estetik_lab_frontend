import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Campaign } from '../../services/campaign';
import { CampaignAdminListItem, CampaignStatus } from '../../models/campaign';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/kampanje. Paginated, same debounced-search +
 * MatPaginatorModule/PageEvent pattern as admin-coupon-list.ts. Edit link is
 * hidden for `sent` campaigns - a sent campaign is done, no more editing (see
 * admin-campaign-form's own guard for the matching direct-navigation case). */
@Component({
  selector: 'app-admin-campaign-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-campaign-list.html',
  styleUrl: './admin-campaign-list.scss',
})
export class AdminCampaignList implements OnInit {
  private campaign = inject(Campaign);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<CampaignAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `naslov`/`predmet`/`status`/`zakazanoZa`/`poslatoZa`/`kreirano` are plain
   * scalar columns (title, subject, status, scheduledFor, sentAt, createdAt)
   * on the Campaign schema - see CAMPAIGN_SORT_FIELDS in
   * admin-marketing.controller.js. `segment` (formatted from
   * targetInterests[]) and `poslato` (combined sentCount/failedCount display)
   * are NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default ({ createdAt: -1, _id: -1 } in
   * campaign.repository.js/findCampaigns). */
  defaultSort = { active: 'kreirano', direction: 'desc' as const };

  columns: DataTableColumn<CampaignAdminListItem>[] = [
    { key: 'naslov', label: 'Naslov', sortable: true },
    { key: 'segment', label: 'Segment' },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'zakazanoZa', label: 'Zakazano za', sortable: true, value: (row) => row.zakazanoZa ?? '-' },
    { key: 'poslatoZa', label: 'Poslato', sortable: true, value: (row) => row.poslatoZa ?? '-' },
    { key: 'poslato', label: 'Uspešno / neuspešno', value: (row) => `${row.poslato} / ${row.neuspesno}` },
    { key: 'kreirano', label: 'Kreirano', sortable: true },
  ];

  actions: DataTableAction<CampaignAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/kampanje', row.id, 'pregled']) },
    {
      icon: 'edit',
      label: 'Izmeni',
      visible: (row) => row.statusRaw !== 'sent',
      onClick: (row) => this.router.navigate(['/admin/kampanje', row.id]),
    },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati kampanju?', onClick: (row) => this.remove(row) },
  ];

  statusOptions: { value: '' | CampaignStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'draft', label: 'Nacrt' },
    { value: 'scheduled', label: 'Zakazano' },
    { value: 'sent', label: 'Poslato' },
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
    this.campaign
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
          this.error.set(error?.message || 'Greška pri učitavanju kampanja.');
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

  statusClass(statusRaw: CampaignStatus): string {
    return `admin-campaign-list__status admin-campaign-list__status--${statusRaw}`;
  }

  remove(row: CampaignAdminListItem): void {
    this.campaign.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Kampanja je obrisana.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
