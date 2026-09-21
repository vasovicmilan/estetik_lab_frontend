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
import { Campaign } from '../../services/campaign';
import { CampaignAdminListItem, CampaignStatus } from '../../models/campaign';
import { ApiMeta } from '../../../../core/models/api-response';

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
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-campaign-list.html',
  styleUrl: './admin-campaign-list.scss',
})
export class AdminCampaignList implements OnInit {
  private campaign = inject(Campaign);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['naslov', 'segment', 'status', 'zakazanoZa', 'poslatoZa', 'poslato', 'kreirano', 'akcije'];
  rows = signal<CampaignAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.campaign
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

  statusClass(statusRaw: CampaignStatus): string {
    return `admin-campaign-list__status admin-campaign-list__status--${statusRaw}`;
  }

  remove(row: CampaignAdminListItem): void {
    if (!confirm(`Obrisati kampanju "${row.naslov}"?`)) return;

    this.campaign.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Kampanja je obrisana.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
