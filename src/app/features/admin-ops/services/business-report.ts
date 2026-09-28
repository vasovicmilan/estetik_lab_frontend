import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { BusinessReportDashboard, BusinessReportPeriodType, BusinessReportSummary } from '../models/business-report';

/** `admin/business-reports`, permission `view_business_reports`. Read-only. */
@Injectable({ providedIn: 'root' })
export class AdminBusinessReport {
  private api = inject(Api);

  /** Live current-period summary for all five period types at once. */
  getLive(): Observable<BusinessReportDashboard> {
    return this.api.get<BusinessReportDashboard>('admin/business-reports');
  }

  listHistory(periodType: BusinessReportPeriodType, params: FilterParams): Observable<{ data: BusinessReportSummary[]; meta?: ApiMeta }> {
    return this.api.getList<BusinessReportSummary[]>(`admin/business-reports/history/${periodType}`, params);
  }

  getByPeriodKey(periodType: BusinessReportPeriodType, periodKey: string): Observable<BusinessReportSummary> {
    return this.api.get<BusinessReportSummary>(`admin/business-reports/history/${periodType}/${periodKey}`);
  }

  /** GET .../pdf - binary response, only available for a STORED period summary
   * (one with a periodKey, i.e. from history/detail) - there's no PDF for the
   * live/in-progress current period (see downloadBusinessReportPdf on the
   * backend, which 404s without a saved BusinessReportSummary doc). */
  downloadPdf(periodType: BusinessReportPeriodType, periodKey: string): Observable<Blob> {
    return this.api.downloadBlob(`admin/business-reports/history/${periodType}/${periodKey}/pdf`);
  }
}
