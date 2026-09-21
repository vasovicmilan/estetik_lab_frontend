// Mirrors GET /api/v1/employee/profile and PUT /api/v1/employee/profile/working-hours
// on the backend - the logged-in EMPLOYEE's own profile + working-hours self-edit.
// Deliberately separate from the admin feature's EmployeeEditPayload
// (features/employees/models/employee.ts): this is a read-mostly self-service
// shape (only workingHours is writable from here - name/email/phone/services stay
// admin-managed), not the full create/edit payload.

import { EmployeeAdminWorkingHoursDisplay, EmployeeWeekDay, EmployeeWorkingHoursEntry } from '../../employees/models/employee';

export interface EmployeeSelfProfile {
  id: string;
  imePrezime: string;
  email: string | null;
  telefon: string | null;
  /** Service NAMES, read-only display - not editable here. */
  usluge: string[];
  /** Mirrors mapEmployeeForEmployeeDetail() on the backend - one entry per day
   * that has hours, each with its already-translated/formatted slot strings
   * (e.g. "09:00 - 13:00"). NOT a pre-formatted string (that was a wrong
   * assumed shape - the backend always sent the same array shape used by
   * EmployeeAdminDetail.radnoVreme, see employee.mapper.js). */
  radnoVreme: EmployeeAdminWorkingHoursDisplay[];
  /** Feed directly into the working-hours editor (FormArray of slots per day,
   * same pattern as admin-employee-form). */
  workingHoursRaw: EmployeeWorkingHoursEntry[];
  isCommissionBased: boolean;
}

export interface EmployeeWorkingHoursUpdatePayload {
  workingHours: EmployeeWorkingHoursEntry[];
}

// Re-exported for convenience so components only need to import from this file.
export type { EmployeeWeekDay, EmployeeWorkingHoursEntry };
