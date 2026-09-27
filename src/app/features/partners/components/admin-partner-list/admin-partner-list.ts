import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Partner } from '../../services/partner';
import { PartnerAdminListItem } from '../../models/partner';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Mirrors admin-user-list's filter-bar + admin-category-list's paginate/delete
 * pattern. `isActive` is optional on the backend (omit the param for "all"),
 * so the "Svi" option sends undefined rather than a literal value. */
@Component({
  selector: 'app-admin-partner-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, DataTable],
  templateUrl: './admin-partner-list.html',
  styleUrl: './admin-partner-list.scss',
})
export class AdminPartnerList implements OnInit {
  private partner = inject(Partner);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<PartnerAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `procenatProvizijeUsluge`/`procenatProvizijeArtikli`/`aktivan`/`kreiran`
   * are plain scalar columns (commissionRateServices, commissionRateProducts,
   * isActive, createdAt) on the Partner schema - see PARTNER_SORT_FIELDS in
   * admin-people.controller.js. `imePrezime`/`email` (populated User fields)
   * are NOT sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default ({ createdAt: -1, _id: -1 } in
   * partner.repository.js/findPartners). */
  defaultSort = { active: 'kreiran', direction: 'desc' as const };

  columns: DataTableColumn<PartnerAdminListItem>[] = [
    { key: 'imePrezime', label: 'Ime i prezime' },
    { key: 'email', label: 'Email', value: (row) => row.email ?? '-' },
    { key: 'procenatProvizijeUsluge', label: 'Provizija usluge', sortable: true },
    { key: 'procenatProvizijeArtikli', label: 'Provizija artikli', sortable: true },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
    { key: 'kreiran', label: 'Kreiran', sortable: true },
  ];

  actions: DataTableAction<PartnerAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/partneri', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/partneri', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati partnera?', onClick: (row) => this.remove(row) },
  ];

  statusOptions: { value: '' | 'true' | 'false'; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'true', label: 'Aktivni' },
    { value: 'false', label: 'Neaktivni' },
  ];

  filterForm = this.fb.group({
    isActive: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { isActive } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.partner
      .listAdmin({
        page,
        limit: this.limit,
        isActive: isActive || undefined,
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
          this.error.set(error?.message || 'Greška pri učitavanju partnera.');
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

  remove(row: PartnerAdminListItem): void {
    this.partner.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Partner je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 5000 }),
    });
  }
}
