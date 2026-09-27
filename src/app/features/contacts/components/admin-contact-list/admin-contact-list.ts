import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Contact } from '../../services/contact';
import { ContactAdminListItem, ContactStatus } from '../../models/contact';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

/** List + filter bar for admin/poruke. Paginated, same MatPaginatorModule/
 * PageEvent pattern as the other admin lists. `new` rows are highlighted (see
 * .admin-contact-list__status--new) since they need attention. Re-fetches every
 * time the route activates (ngOnInit, not a cached resolver), so navigating
 * back here after a detail view's automatic new->read transition reflects the
 * current status. */
@Component({
  selector: 'app-admin-contact-list',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, DataTable, DataTableCellDef],
  templateUrl: './admin-contact-list.html',
  styleUrl: './admin-contact-list.scss',
})
export class AdminContactList implements OnInit {
  private contact = inject(Contact);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<ContactAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  /** `email`/`tema`/`status`/`datum` are plain scalar columns (email, topic,
   * status, createdAt) on the Contact schema - see CONTACT_SORT_FIELDS in
   * admin-marketing.controller.js. `imePrezime` (firstName + decrypted
   * lastName, concatenated) is NOT sortable - not a scalar column a
   * repository can sort on directly. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches contactRepo.findContacts's own default ({ createdAt: -1, _id: -1 }). */
  defaultSort = { active: 'datum', direction: 'desc' as const };

  columns: DataTableColumn<ContactAdminListItem>[] = [
    { key: 'imePrezime', label: 'Ime i prezime' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'tema', label: 'Tema', value: (row) => row.tema ?? '-', sortable: true },
    { key: 'status', label: 'Status', type: 'custom', sortable: true },
    { key: 'datum', label: 'Datum', sortable: true },
  ];

  actions: DataTableAction<ContactAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/poruke', row.id, 'pregled']) },
  ];

  statusOptions: { value: '' | ContactStatus; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'new', label: 'Novi' },
    { value: 'read', label: 'Pročitani' },
    { value: 'replied', label: 'Odgovoreni' },
    { value: 'archived', label: 'Arhivirani' },
  ];

  filterForm = this.fb.group({
    status: [''],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { status } = this.filterForm.value;

    this.loading.set(true);
    this.error.set(null);
    this.contact
      .listAdmin({
        page,
        limit: this.limit,
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
          this.error.set(error?.message || 'Greška pri učitavanju poruka.');
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

  statusClass(statusRaw: ContactStatus): string {
    return `admin-contact-list__status admin-contact-list__status--${statusRaw}`;
  }
}
