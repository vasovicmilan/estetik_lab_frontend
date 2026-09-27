import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { AdminLogReport } from '../../services/log-report';
import { LogSummary } from '../../models/log-summary';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Paginated list of past daily LogSummary docs, each linking to its own
 * detail page. Mounted at /admin/logovi/istorija. */
@Component({
  selector: 'app-admin-logs-history-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-logs-history-list.html',
  styleUrl: './admin-logs-history-list.scss',
})
export class AdminLogsHistoryList implements OnInit {
  private logReport = inject(AdminLogReport);
  private router = inject(Router);

  rows = signal<LogSummary[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 20;
  /** `date`/`total`/`errors`/`avgMs` map to plain scalar (`total`/`errors`/`avgMs`
   * are nested-but-scalar) fields already stored on each LogSummary doc - see
   * LOG_SUMMARY_SORT_FIELDS in admin-ops.controller.js. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches logSummaryRepo.findLogSummaries's own default ({ date: -1 }). */
  defaultSort = { active: 'date', direction: 'desc' as const };

  columns: DataTableColumn<LogSummary>[] = [
    { key: 'date', label: 'Datum', sortable: true },
    { key: 'total', label: 'Ukupno zahteva', value: (row) => row.requests.total, sortable: true },
    { key: 'errors', label: 'Greške', value: (row) => row.logs.errorCount, sortable: true },
    { key: 'avgMs', label: 'Prosečno vreme (ms)', value: (row) => Math.round(row.perf.avgResponseTimeMs * 10) / 10, sortable: true },
  ];

  actions: DataTableAction<LogSummary>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/logovi/istorija', row.date]) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.logReport
      .listHistory({
        page,
        limit: this.limit,
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
          this.error.set(error?.message || 'Greška pri učitavanju izveštaja o logovima.');
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
}
