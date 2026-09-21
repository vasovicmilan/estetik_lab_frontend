// Mirrors GET /api/v1/employee/profile and PUT /api/v1/employee/profile/working-hours
// on the backend - the logged-in EMPLOYEE's own profile + working-hours self-edit.
// Deliberately separate from the admin feature's EmployeeEditPayload
// (features/employees/models/employee.ts): this is a read-mostly self-service
// shape (only workingHours is writable from here - name/email/phone/services stay
// admin-managed), not the full create/edit payload.

import { EmployeeWeekDay, EmployeeWorkingHoursEntry } from '../../employees/models/employee';

export interface EmployeeSelfProfile {
  id: string;
  imePrezime: string;
  email: string | null;
  telefon: string | null;
  /** Service NAMES, read-only display - not editable here. */
  usluge: string[];
  /** Pre-formatted display summary, read-only. */
  radnoVreme: string;
  /** Feed directly into the same working-hours editor pattern as
   * admin-employee-form (see EmployeeWorkingHoursEntry's own comment for the
   * single-slot-per-day v1 limitation this reuses). */
  workingHoursRaw: EmployeeWorkingHoursEntry[];
  isCommissionBased: boolean;
}

export interface EmployeeWorkingHoursUpdatePayload {
  workingHours: EmployeeWorkingHoursEntry[];
}

// Re-exported for convenience so components only need to import from this file.
export type { EmployeeWeekDay, EmployeeWorkingHoursEntry };
