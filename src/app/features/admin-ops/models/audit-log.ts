// GET /admin/audit-log (admin-ops.controller.js's listAuditLogs) returns RAW,
// unmapped Mongoose documents - same "raw list" convention already used by
// employee-portal's commission list / partner-portal's commission list (see
// employee-portal/models/commission.ts's header comment) - translate/format
// client-side, there is no server-side mapper for this list.

export interface AuditLogChange {
  old: unknown;
  new: unknown;
}

export interface AuditLogEntry {
  _id: string;
  timestamp: string; // ISO datetime
  actor: { id: string | null; email: string | null; role: string | null };
  /** SCREAMING_SNAKE_CASE, e.g. "PARTNER_CREATED", "PAYOUT_APPROVED" - grows
   * over time, displayed lightly humanized (underscores -> spaces) rather than
   * through a full per-action translation map. */
  action: string;
  entity: { type: string | null; id: string | null };
  changes: Record<string, AuditLogChange> | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  success: boolean;
  errorMessage: string | null;
}

/** Query params for GET /admin/audit-log - `meta.availableActions` (returned
 * alongside the page) populates the action filter's options. */
export interface AuditLogFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  success?: boolean | string;
  actorId?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}
