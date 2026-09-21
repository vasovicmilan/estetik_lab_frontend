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
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Partner } from '../../services/partner';
import { PartnerAdminListItem } from '../../models/partner';
import { ApiMeta } from '../../../../core/models/api-response';

/** Mirrors admin-user-list's filter-bar + admin-category-list's paginate/delete
 * pattern. `isActive` is optional on the backend (omit the param for "all"),
 * so the "Svi" option sends undefined rather than a literal value. */
@Component({
  selector: 'app-admin-partner-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-partner-list.html',
  styleUrl: './admin-partner-list.scss',
})
export class AdminPartnerList implements OnInit {
  private partner = inject(Partner);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['imePrezime', 'email', 'procenatProvizijeUsluge', 'procenatProvizijeArtikli', 'aktivan', 'kreiran', 'akcije'];
  rows = signal<PartnerAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.partner
      .listAdmin({
        page,
        limit: 10,
        isActive: isActive || undefined,
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

  remove(row: PartnerAdminListItem): void {
    if (!confirm(`Obrisati partnera "${row.imePrezime}"?`)) return;

    this.partner.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Partner je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 5000 }),
    });
  }
}
