// Mirrors GET /api/v1/employee/dashboard on the backend - a single combined
// summary view for the employee portal's landing page.

import { EmployeeAppointmentListItem } from './appointment';
import { CommissionEntry } from './commission';

export interface EmployeeBalance {
  /** Raw RSD numbers - this app has no currency pipe, render with " RSD"
   * appended client-side (same convention as account/order.ts's money fields). */
  earned: number;
  paid: number;
  reserved: number;
  available: number;
}

export interface EmployeeDashboard {
  todayAppointments: EmployeeAppointmentListItem[];
  /** How many of weekAppointments are status "Na čekanju" - pre-counted
   * server-side, not derived client-side. */
  pendingCount: number;
  weekAppointments: EmployeeAppointmentListItem[];
  isCommissionBased: boolean;
  /** null when !isCommissionBased. */
  balance: EmployeeBalance | null;
  /** Up to 5 - empty array when !isCommissionBased. */
  recentCommissions: CommissionEntry[];
}
