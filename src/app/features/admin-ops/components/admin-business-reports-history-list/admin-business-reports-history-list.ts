import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { AdminBusinessReport } from '../../services/business-report';
import { BUSINESS_REPORT_PERIOD_LABELS, BusinessReportPeriodType, BusinessReportSummary } from '../../models/business-report';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';

/** Paginated archive of past periods for one period type - GET
 * /admin/business-reports/history/:periodType. Mounted at
 * /admin/izvestaji/:periodType. */
@Component({
  selector: 'app-admin-business-reports-history-list',
  imports: [CommonModule, RouterLink, MatButtonModule, DataTable],
  templateUrl: './admin-business-reports-history-list.html',
  styleUrl: './admin-business-reports-history-list.scss',
})
export class AdminBusinessReportsHistoryList implements OnInit {
  private businessReport = inject(AdminBusinessReport);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  periodType = signal<BusinessReportPeriodType | null>(null);
  periodLabels = BUSINESS_REPORT_PERIOD_LABELS;

  rows = signal<BusinessReportSummary[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 20;
  /** `periodKey` is a plain scalar column; `appointmentsRevenue`/`ordersRevenue`
   * map to nested-but-scalar fields already stored on each BusinessReportSummary
   * doc - see BUSINESS_REPORT_SORT_FIELDS in admin-ops.controller.js. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** Matches businessReportRepo.listSummaries's own default ({ periodKey: -1 }). */
  defaultSort = { active: 'periodKey', direction: 'desc' as const };

  columns: DataTableColumn<BusinessReportSummary>[] = [
    { key: 'periodKey', label: 'Period', sortable: true },
    { key: 'appointmentsRevenue', label: 'Prihod (termini)', value: (row) => `${row.appointments.revenue} RSD`, sortable: true },
    { key: 'ordersRevenue', label: 'Prihod (porudžbine)', value: (row) => `${row.orders.revenue} RSD`, sortable: true },
  ];

  actions: DataTableAction<BusinessReportSummary>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(this.detailLink(row)) },
  ];

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
    this.error.set(null);
    this.businessReport
      .listHistory(periodType, {
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
          this.error.set(error?.message || 'Greška pri učitavanju izveštaja.');
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

  detailLink(row: BusinessReportSummary): string[] {
    return ['/admin/izvestaji', this.periodType()!, row.periodKey];
  }
}
