// Mirrors GET /api/v1/partner/payouts and POST /api/v1/partner/payouts on the
// backend - also raw/unformatted, same shape the employee portal already uses
// (see employee-portal/models/payout.ts's header comment): amount is a plain
// number, status is the backend's own English enum (translate client-side),
// timestamps are raw ISO strings.

export type PartnerPayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export interface PartnerPayoutRequest {
  id: string;
  amount: number;
  status: PartnerPayoutStatus;
  adminNote: string | null;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
}

/** Body for POST /partner/payouts. Backend validates amount >= 1 and rejects
 * (400) with its own message when amount exceeds the partner's available
 * balance - surfaced via the normal error snackbar rather than duplicating
 * that check client-side. */
export interface PartnerPayoutRequestPayload {
  amount: number;
}
