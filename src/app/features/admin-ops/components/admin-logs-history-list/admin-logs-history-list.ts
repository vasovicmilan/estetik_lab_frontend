import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLogReport } from '../../services/log-report';
import { LogSummary } from '../../models/log-summary';
import { ApiMeta } from '../../../../core/models/api-response';

/** Paginated list of past daily LogSummary docs, each linking to its own
 * detail page. Mounted at /admin/logovi/istorija. */
@Component({
  selector: 'app-admin-logs-history-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-logs-history-list.html',
  styleUrl: './admin-logs-history-list.scss',
})
export class AdminLogsHistoryList implements OnInit {
  private logReport = inject(AdminLogReport);

  displayedColumns = ['date', 'total', 'errors', 'avgMs', 'akcije'];
  rows = signal<LogSummary[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.logReport.listHistory({ page, limit: 20 }).subscribe({
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
