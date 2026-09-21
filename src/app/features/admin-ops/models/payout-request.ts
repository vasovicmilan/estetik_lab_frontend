// Mirrors payout-request.controller.js's admin-ops JSON shapes exactly (see
// admin-ops.controller.js's listPayoutRequests/getPayoutRequest). Admin-facing
// management of payout requests from BOTH employees and partners - distinct
// from the earner's own self-service payout models (employee-portal/models/
// payout.ts, partner-portal/models/commission.ts), those are unrelated.
// Permission `manage_payouts`.

export type PayoutEarnerType = 'Zaposleni' | 'Partner';
export type PayoutStatusRaw = 'requested' | 'approved' | 'paid' | 'rejected';

// ---- Admin list row (GET /admin/payout-requests) ----

export interface PayoutRequestAdminListItem {
  id: string;
  earnerType: PayoutEarnerType;
  earnerName: string;
  iznos: string; // already formatted "1.234 RSD"
  status: string; // already Serbian: "Zatraženo"|"Odobreno"|"Isplaćeno"|"Odbijeno"
  statusRaw: PayoutStatusRaw;
  zatrazeno: string; // already formatted datetime string
}

// ---- Admin detail (GET /admin/payout-requests/:requestId, and the response
// of approve/pay/reject) ----

export interface PayoutRequestAdminDetail {
  id: string;
  earnerType: PayoutEarnerType;
  earnerName: string;
  iznos: string;
  status: string;
  statusRaw: PayoutStatusRaw;
  napomena: string | null;
  vreme: {
    zatrazeno: string;
    odobreno: string | null;
    isplaceno: string | null;
    odbijeno: string | null;
  };
}

/** Body for approve/pay/reject - reason is always optional free text. */
export interface PayoutActionPayload {
  reason?: string;
}

/** Body for POST /admin/payout-requests/direct - records an already-happened
 * payout directly, skipping the request step entirely. */
export interface PayoutDirectPayload {
  earnerType: 'employee' | 'partner';
  earnerId: string;
  amount: number;
  note?: string;
}
