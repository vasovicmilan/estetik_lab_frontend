import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { BusinessPartner } from '../../services/business-partner';
import { BusinessPartnerAdminListItem } from '../../models/business-partner';
import { ApiMeta } from '../../../../core/models/api-response';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** Mirrors admin-user-list's search-filter + admin-category-list's
 * paginate/delete pattern. */
@Component({
  selector: 'app-admin-business-partner-list',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-business-partner-list.html',
  styleUrl: './admin-business-partner-list.scss',
})
export class AdminBusinessPartnerList implements OnInit {
  private businessPartner = inject(BusinessPartner);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['slika', 'naziv', 'aktivan', 'kreirano', 'akcije'];
  rows = signal<BusinessPartnerAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

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
    this.businessPartner
      .listAdmin({
        page,
        limit: 10,
        search: search || undefined,
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

  remove(row: BusinessPartnerAdminListItem): void {
    if (!confirm(`Obrisati saradnika "${row.naziv}"?`)) return;

    this.businessPartner.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Poslovni saradnik je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
