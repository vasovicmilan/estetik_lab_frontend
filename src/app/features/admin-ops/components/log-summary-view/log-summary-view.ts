import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogSummary } from '../../models/log-summary';

/** Presentational-only - stat cards + small tables for one LogSummary. Reused
 * by both the live dashboard (admin-logs-dashboard) and a single stored day
 * (admin-logs-history-detail), same shape either way (see LogSummary's header
 * comment), per the task's "reuse the same display component/template"
 * guidance. */
@Component({
  selector: 'app-log-summary-view',
  imports: [CommonModule],
  templateUrl: './log-summary-view.html',
  styleUrl: './log-summary-view.scss',
})
export class LogSummaryView {
  summary = input.required<LogSummary>();

  formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('sr-RS');
  }
}
