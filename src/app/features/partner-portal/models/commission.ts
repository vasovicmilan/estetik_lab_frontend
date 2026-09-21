// Mirrors GET /api/v1/partner/commissions on the backend - same raw/unmapped
// Mongoose lean() shape the employee portal already consumes for its own
// commissions (see employee-portal/models/commission.ts's header comment for
// the full rationale): amounts are plain numbers (append " RSD" client-side),
// status/sourceType are the backend's own English enum values (translate to
// Serbian client-side), and timestamps are raw ISO strings (format client-side
// with toLocaleDateString('sr-RS')).

export type PartnerCommissionEarnerType = 'employee' | 'partner';
export type PartnerCommissionSourceType = 'appointment' | 'order' | 'package_purchase';
export type PartnerCommissionStatus = 'pending' | 'earned' | 'reversed';

export interface PartnerCommissionEntry {
  _id: string;
  earnerType: PartnerCommissionEarnerType;
  employee: string | null;
  partner: string | null;
  sourceType: PartnerCommissionSourceType;
  /** Unpopulated ObjectId strings - just ids, no names available, do not try to
   * look them up. Only the one matching sourceType is ever set. */
  appointment: string | null;
  order: string | null;
  packagePurchase: string | null;
  baseValue: number;
  rate: number;
  amount: number;
  status: PartnerCommissionStatus;
  earnedAt: string | null;
  reversedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
