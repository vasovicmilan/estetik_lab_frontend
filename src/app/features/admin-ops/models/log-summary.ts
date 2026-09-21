// Mirrors logReportService's LogSummary shape exactly (GET /admin/logs,
// /admin/logs/history, /admin/logs/history/:date - see admin-ops.controller.js's
// getLogDashboard/listLogSummaries/getLogSummary). Today's live summary and every
// stored past-day summary share this same shape; `isLive` only appears on the
// live one. All counts/timings are already-computed numbers - no client-side
// formatting needed beyond a unit suffix (ms).

export interface LogCountBucket {
  label: string;
  count: number;
}

export interface LogSummary {
  /** Absent on a stored-history entry accessed via _id/date instead - both are
   * optional here so this one interface fits live + history + single-day. */
  _id?: string;
  date: string; // "YYYY-MM-DD"
  isLive?: true;
  generatedAt: string; // ISO datetime
  requests: {
    total: number;
    byStatusClass: { '2xx': number; '3xx': number; '4xx': number; '5xx': number };
    uniqueIPs: number;
  };
  logs: { infoCount: number; warnCount: number; errorCount: number };
  perf: {
    avgResponseTimeMs: number;
    maxResponseTimeMs: number;
    maxResponseTimeUrl: string | null;
    totalResponseTimeMs: number;
    responseTimeSampleCount: number;
    slowestRoutes: { label: string; avgMs: number; count: number }[];
  };
  topErrors: LogCountBucket[];
  topUrls: LogCountBucket[];
  topErrorUrls: LogCountBucket[];
}
