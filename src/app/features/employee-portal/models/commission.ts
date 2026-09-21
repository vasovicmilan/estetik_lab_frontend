// Mirrors GET /api/v1/employee/commissions on the backend - NOTE: unlike almost
// every other list endpoint in this app, this one is confirmed (by reading the
// actual service code) to return the RAW, unmapped Mongoose lean() result
// directly, not a translated/pre-formatted display shape. So unlike
// EmployeeAppointmentListItem's `status`/`cena` etc., the fields below are raw:
// amounts are plain numbers (append " RSD" client-side), status/sourceType are
// the backend's own English enum values (translate to Serbian client-side, see
// employee-earnings's sourceTypeLabel()/statusLabel() helpers), and createdAt is
// a raw ISO string (format client-side with toLocaleDateString('sr-RS'), there's
// no existing date-pipe convention elsewhere in this app to mirror).

export type CommissionEarnerType = 'employee' | 'partner';
export type CommissionSourceType = 'appointment' | 'order' | 'package_purchase';
export type CommissionStatus = 'pending' | 'earned' | 'reversed';

export interface CommissionEntry {
  _id: string;
  earnerType: CommissionEarnerType;
  employee: string | null;
  employeeSnapshot?: { name: string | null };
  partner: string | null;
  sourceType: CommissionSourceType;
  /** Unpopulated ObjectId strings - just ids, no names available, do not try to
   * look them up. Only the one matching sourceType is ever set. */
  appointment: string | null;
  order: string | null;
  packagePurchase: string | null;
  baseValue: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  earnedAt: string | null;
  reversedAt: string | null;
  reversalReason?: string;
  createdAt: string;
  updatedAt: string;
}
