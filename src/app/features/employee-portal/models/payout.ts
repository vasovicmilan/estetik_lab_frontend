// Mirrors GET /api/v1/employee/payouts and POST /api/v1/employee/payouts on the
// backend - also raw/unformatted, same as CommissionEntry (see commission.ts's
// header comment): amount is a plain number, status is the backend's own English
// enum (translate client-side), timestamps are raw ISO strings.

export type PayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export interface PayoutRequest {
  id: string;
  amount: number;
  status: PayoutStatus;
  adminNote: string | null;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
}

/** Body for POST /employee/payouts. Backend rejects (400) with its own message
 * when amount exceeds the employee's current available balance - surfaced via
 * the normal error snackbar rather than duplicating that check client-side. */
export interface PayoutRequestPayload {
  amount: number;
}
