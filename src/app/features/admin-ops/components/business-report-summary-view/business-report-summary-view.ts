import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Card } from '../../../../shared/ui/card/card';
import { BusinessReportSummary } from '../../models/business-report';

/** Presentational-only - stat cards (app-card, variant="stat") + top-N tables
 * (mat-table) for one BusinessReportSummary (one period). Reused by the live
 * dashboard's tabs and by a single stored period's detail page, same shape
 * either way. Money fields are RAW numbers - formatted here with a " RSD"
 * suffix, same convention as employee-portal/partner-portal earnings pages
 * (see models/business-report.ts's header comment). */
@Component({
  selector: 'app-business-report-summary-view',
  imports: [CommonModule, MatTableModule, Card],
  templateUrl: './business-report-summary-view.html',
  styleUrl: './business-report-summary-view.scss',
})
export class BusinessReportSummaryView {
  summary = input.required<BusinessReportSummary>();

  /** Same 3 columns (label/count/value) shared by all 4 top-N tables below. */
  tableColumns = ['label', 'count', 'value'];

  formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
  }

  /** Rounds to a whole number before formatting - mirrors the backend's own
   * display convention (formatPrice() in price.util.js), since these summary
   * fields come through as raw, unrounded numbers (percentage-based commission
   * math can leave fractional RSD, e.g. 11% of 2850 = 313.5). */
  money(value: number): string {
    return `${Math.round(value).toLocaleString('sr-RS')} RSD`;
  }

  /** Top 8 rows sorted by value (falls back to count when every value is 0). */
  topByValue<T extends { count: number; value: number }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => b.value - a.value || b.count - a.count).slice(0, 8);
  }
}
