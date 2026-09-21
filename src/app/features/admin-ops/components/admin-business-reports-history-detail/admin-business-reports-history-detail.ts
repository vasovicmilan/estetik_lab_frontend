import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AdminBusinessReport } from '../../services/business-report';
import { BusinessReportPeriodType, BusinessReportSummary } from '../../models/business-report';
import { BusinessReportSummaryView } from '../business-report-summary-view/business-report-summary-view';

/** Single stored period's summary - GET
 * /admin/business-reports/history/:periodType/:periodKey. A 404 (no summary
 * stored for that period) is shown as a friendly message. Mounted at
 * /admin/izvestaji/:periodType/:periodKey. */
@Component({
  selector: 'app-admin-business-reports-history-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, BusinessReportSummaryView],
  templateUrl: './admin-business-reports-history-detail.html',
  styleUrl: './admin-business-reports-history-detail.scss',
})
export class AdminBusinessReportsHistoryDetail implements OnInit {
  private businessReport = inject(AdminBusinessReport);
  private route = inject(ActivatedRoute);

  periodType = signal<BusinessReportPeriodType | null>(null);
  periodKey = signal<string | null>(null);
  summary = signal<BusinessReportSummary | null>(null);
  loading = signal(false);
  notFound = signal(false);

  ngOnInit(): void {
    const periodType = this.route.snapshot.paramMap.get('periodType') as BusinessReportPeriodType | null;
    const periodKey = this.route.snapshot.paramMap.get('periodKey');
    if (!periodType || !periodKey) return;

    this.periodType.set(periodType);
    this.periodKey.set(periodKey);
    this.loading.set(true);
    this.notFound.set(false);
    this.businessReport
      .getByPeriodKey(periodType, periodKey)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.notFound.set(true),
      });
  }
}
