// Mirrors businessReportService's Summary shape exactly (GET /admin/business-reports,
// /admin/business-reports/history/:periodType, /admin/business-reports/history/:periodType/:periodKey
// - see admin-ops.controller.js's getBusinessReportDashboard/listBusinessReports/
// getBusinessReport). Money fields (revenue/value/discount/commission amounts)
// are RAW numbers - format with " RSD" client-side, same convention as
// employee-portal/partner-portal earnings pages.

export type BusinessReportPeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const BUSINESS_REPORT_PERIOD_TYPES: BusinessReportPeriodType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export const BUSINESS_REPORT_PERIOD_LABELS: Record<BusinessReportPeriodType, string> = {
  daily: 'Dnevno',
  weekly: 'Nedeljno',
  monthly: 'Mesečno',
  quarterly: 'Kvartalno',
  yearly: 'Godišnje',
};

export interface BusinessReportBucket {
  label: string;
  count: number;
  value: number;
}

export interface BusinessReportSummary {
  periodType: string;
  periodKey: string; // e.g. "2026-09-21" / "2026-W38" / "2026-09" / "2026-Q3" / "2026"
  periodStart: string; // ISO datetime
  periodEnd: string; // ISO datetime
  appointments: {
    total: number;
    byStatus: BusinessReportBucket[];
    revenue: number;
    byService: BusinessReportBucket[];
    byEmployee: BusinessReportBucket[];
    noShowRate: number;
  };
  orders: {
    total: number;
    byStatus: BusinessReportBucket[];
    revenue: number;
    avgOrderValue: number;
    byProduct: BusinessReportBucket[];
  };
  packages: { totalPurchased: number; revenue: number };
  commissions: { employeeEarned: number; employeePaid: number; partnerEarned: number; partnerPaid: number };
  coupons: { totalRedemptions: number; totalDiscountGiven: number; byCoupon: BusinessReportBucket[] };
  generatedAt: string;
}

/** GET /admin/business-reports - live current-period summary for all five
 * period types at once. */
export type BusinessReportDashboard = Record<BusinessReportPeriodType, BusinessReportSummary>;
