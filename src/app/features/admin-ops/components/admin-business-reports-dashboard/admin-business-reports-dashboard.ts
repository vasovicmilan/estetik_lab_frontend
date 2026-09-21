import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminBusinessReport } from '../../services/business-report';
import { BUSINESS_REPORT_PERIOD_LABELS, BUSINESS_REPORT_PERIOD_TYPES, BusinessReportDashboard, BusinessReportPeriodType } from '../../models/business-report';
import { BusinessReportSummaryView } from '../business-report-summary-view/business-report-summary-view';

/** Live current-period summary for all five period types at once, one
 * Material tab per period type. Mounted at /admin/izvestaji. */
@Component({
  selector: 'app-admin-business-reports-dashboard',
  imports: [CommonModule, RouterLink, MatTabsModule, MatButtonModule, MatProgressSpinnerModule, BusinessReportSummaryView],
  templateUrl: './admin-business-reports-dashboard.html',
  styleUrl: './admin-business-reports-dashboard.scss',
})
export class AdminBusinessReportsDashboard implements OnInit {
  private businessReport = inject(AdminBusinessReport);
  private snackBar = inject(MatSnackBar);

  periodTypes = BUSINESS_REPORT_PERIOD_TYPES;
  periodLabels = BUSINESS_REPORT_PERIOD_LABELS;

  dashboard = signal<BusinessReportDashboard | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.businessReport
      .getLive()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: (error) => this.snackBar.open(error?.message || 'Greška pri učitavanju izveštaja.', 'U redu', { duration: 4000 }),
      });
  }

  historyLink(periodType: BusinessReportPeriodType): string[] {
    return ['/admin/izvestaji', periodType];
  }
}
