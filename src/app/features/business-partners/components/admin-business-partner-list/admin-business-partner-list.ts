import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { BusinessPartner } from '../../services/business-partner';
import { BusinessPartnerAdminListItem } from '../../models/business-partner';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** Mirrors admin-user-list's search-filter + admin-category-list's
 * paginate/delete pattern. */
@Component({
  selector: 'app-admin-business-partner-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ImageUrlPipe,
    DataTable,
    DataTableCellDef,
  ],
  templateUrl: './admin-business-partner-list.html',
  styleUrl: './admin-business-partner-list.scss',
})
export class AdminBusinessPartnerList implements OnInit {
  private businessPartner = inject(BusinessPartner);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<BusinessPartnerAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `naziv`/`aktivan`/`kreirano` are plain scalar columns (name, isActive,
   * createdAt) on the BusinessPartner schema - see BUSINESS_PARTNER_SORT_FIELDS
   * in admin-marketing.controller.js. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches the backend's own default ({ createdAt: -1, _id: -1 } in
   * business-partner.repository.js/findBusinessPartners). */
  defaultSort = { active: 'kreirano', direction: 'desc' as const };

  columns: DataTableColumn<BusinessPartnerAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naziv', label: 'Naziv', sortable: true },
    { key: 'aktivan', label: 'Aktivan', type: 'badge', sortable: true, value: (row) => (row.aktivan ? 'Da' : 'Ne') },
    { key: 'kreirano', label: 'Kreirano', sortable: true },
  ];

  actions: DataTableAction<BusinessPartnerAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/poslovni-saradnici', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/poslovni-saradnici', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati saradnika?', onClick: (row) => this.remove(row) },
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
    this.businessPartner
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
          this.error.set(error?.message || 'Greška pri učitavanju saradnika.');
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

  remove(row: BusinessPartnerAdminListItem): void {
    this.businessPartner.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Poslovni saradnik je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
