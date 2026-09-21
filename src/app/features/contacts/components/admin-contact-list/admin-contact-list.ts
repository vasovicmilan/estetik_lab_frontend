import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Contact } from '../../services/contact';
import { ContactAdminListItem, ContactStatus } from '../../models/contact';
import { ApiMeta } from '../../../../core/models/api-response';

/** List + filter bar for admin/poruke. Paginated, same MatPaginatorModule/
 * PageEvent pattern as the other admin lists. `new` rows are highlighted (see
 * .admin-contact-list__row--new) since they need attention. Re-fetches every
 * time the route activates (ngOnInit, not a cached resolver), so navigating
 * back here after a detail view's automatic new->read transition reflects the
 * current status. */
@Component({
  selector: 'app-admin-contact-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-contact-list.html',
  styleUrl: './admin-contact-list.scss',
})
export class AdminContactList implements OnInit {
  private contact = inject(Contact);
  private fb = inject(FormBuilder);

  displayedColumns = ['imePrezime', 'email', 'tema', 'status', 'datum', 'akcije'];
  rows = signal<ContactAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.contact
      .listAdmin({
        page,
        limit: 10,
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
}
