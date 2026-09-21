import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime } from 'rxjs';
import { AdminAuditLog } from '../../services/audit-log';
import { AuditLogEntry } from '../../models/audit-log';

/** Read-only, filterable, paginated table of raw audit-log docs. Rows expand
 * inline (mat-expansion-panel, standard Material - no MatDialog precedent
 * exists elsewhere in this app for a "secondary fields" popup, see
 * confirm-dialog.ts's unused stub) to show changes/ip/userAgent/requestId,
 * which are secondary and don't need their own table columns. Mounted at
 * /admin/audit-log - list only, no detail sub-route. */
@Component({
  selector: 'app-admin-audit-log-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './admin-audit-log-list.html',
  styleUrl: './admin-audit-log-list.scss',
})
export class AdminAuditLogList implements OnInit {
  private auditLog = inject(AdminAuditLog);
  private fb = inject(FormBuilder);

  rows = signal<AuditLogEntry[]>([]);
  meta = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  availableActions = signal<string[]>([]);
  loading = signal(false);

  successOptions: { value: string; label: string }[] = [
    { value: '', label: 'Svi' },
    { value: 'true', label: 'Uspešno' },
    { value: 'false', label: 'Neuspešno' },
  ];

  filterForm = this.fb.group({
    search: [''],
    action: [''],
    success: [''],
    dateFrom: [''],
    dateTo: [''],
    sortOrder: ['desc' as 'asc' | 'desc'],
  });

  ngOnInit(): void {
    this.load(1);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load(1));
  }

  load(page: number): void {
    const { search, action, success, dateFrom, dateTo, sortOrder } = this.filterForm.value;

    this.loading.set(true);
    this.auditLog
      .list({
        page,
        limit: 25,
        search: search || undefined,
        action: action || undefined,
        success: success || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortOrder: sortOrder || 'desc',
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          if (meta?.availableActions) this.availableActions.set(meta.availableActions);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(event: PageEvent): void {
    this.load(event.pageIndex + 1);
  }

  /** Lightly humanize SCREAMING_SNAKE_CASE - keep uppercase, just replace
   * underscores with spaces, per the task's "don't build a full translation
   * map" note. */
  humanizeAction(action: string): string {
    return action.replace(/_/g, ' ');
  }

  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('sr-RS');
  }

  /** JSON.stringify for non-primitives (arrays/objects), plain String() for
   * primitives - matches the task's rendering guidance exactly. */
  formatChangeValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  changeEntries(changes: AuditLogEntry['changes']): { field: string; old: unknown; new: unknown }[] {
    if (!changes) return [];
    return Object.entries(changes).map(([field, change]) => ({ field, old: change.old, new: change.new }));
  }
}
