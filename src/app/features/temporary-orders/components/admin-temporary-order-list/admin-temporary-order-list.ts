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
import { debounceTime } from 'rxjs';
import { TemporaryOrder } from '../../services/temporary-order';
import { TemporaryOrderAdminListItem } from '../../models/temporary-order';
import { ApiMeta } from '../../../../core/models/api-response';

/** List + search bar for admin/privremene-porudzbine. Paginated, same
 * debounced-search + MatPaginatorModule/PageEvent pattern as admin-order-list.ts.
 * No status filter (temporary orders have no status field), no create/edit route -
 * see temporary-orders.routes.ts's header comment. */
@Component({
  selector: 'app-admin-temporary-order-list',
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
  ],
  templateUrl: './admin-temporary-order-list.html',
  styleUrl: './admin-temporary-order-list.scss',
})
export class AdminTemporaryOrderList implements OnInit {
  private temporaryOrder = inject(TemporaryOrder);
  private fb = inject(FormBuilder);

  displayedColumns = ['korisnik', 'email', 'ukupnaCena', 'zahtevaProceenuDostave', 'istice', 'kreirano', 'akcije'];
  rows = signal<TemporaryOrderAdminListItem[]>([]);
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
    this.temporaryOrder
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
}
