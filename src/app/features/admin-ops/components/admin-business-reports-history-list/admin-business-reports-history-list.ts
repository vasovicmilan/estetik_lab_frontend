import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminBusinessReport } from '../../services/business-report';
import { BUSINESS_REPORT_PERIOD_LABELS, BusinessReportPeriodType, BusinessReportSummary } from '../../models/business-report';
import { ApiMeta } from '../../../../core/models/api-response';

/** Paginated archive of past periods for one period type - GET
 * /admin/business-reports/history/:periodType. Mounted at
 * /admin/izvestaji/:periodType. */
@Component({
  selector: 'app-admin-business-reports-history-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-business-reports-history-list.html',
  styleUrl: './admin-business-reports-history-list.scss',
})
export class AdminBusinessReportsHistoryList implements OnInit {
  private businessReport = inject(AdminBusinessReport);
  private route = inject(ActivatedRoute);

  periodType = signal<BusinessReportPeriodType | null>(null);
  periodLabels = BUSINESS_REPORT_PERIOD_LABELS;

  displayedColumns = ['periodKey', 'appointmentsRevenue', 'ordersRevenue', 'akcije'];
  rows = signal<BusinessReportSummary[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const periodType = this.route.snapshot.paramMap.get('periodType') as BusinessReportPeriodType | null;
    if (!periodType) return;

    this.periodType.set(periodType);
    this.load(1);
  }

  load(page: number): void {
    const periodType = this.periodType();
    if (!periodType) return;

    this.loading.set(true);
    this.businessReport.listHistory(periodType, { page, limit: 20 }).subscribe({
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

  detailLink(row: BusinessReportSummary): string[] {
    return ['/admin/izvestaji', this.periodType()!, row.periodKey];
  }
}
