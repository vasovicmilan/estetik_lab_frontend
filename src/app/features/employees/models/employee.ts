// Mirrors employee.mapper.js exactly. "Employee" here is a real login+schedule
// staff account that fulfils appointments (booking-only) - deliberately
// distinct from Expert/Team (a public showcase profile with zero login
// accounts behind it, see features/team/models/expert.ts's header comment).
// Same three-shape split as Service/Expert/Product:
//
// 1. EmployeeAdminListItem - GET /admin/employees             (mapEmployeesForAdminList)
// 2. EmployeeAdminDetail    - GET /admin/employees/:id          (mapEmployeeForAdminDetail)
// 3. EmployeeEditPayload    - GET /admin/employees/:id/edit, and the body of POST/PUT (mapEmployeeForEdit)

export type EmployeePayType = 'salary' | 'commission';
export type EmployeeWeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// ---- (1) Admin list row ----

export interface EmployeeAdminListItem {
  id: string;
  imePrezime: string;
  email: string | null;
  aktivan: 'Da' | 'Ne';
  brojUsluga: number;
  kreiran: string;
}

// ---- (2) Admin detail (display only) - NOT the shape admin-employee-form posts back ----

export interface EmployeeAdminLinkedExpert {
  id: string;
  imePrezime?: string;
  slug?: string;
}

export interface EmployeeAdminWorkingHoursDisplay {
  dan: string;
  /** Pre-formatted strings, e.g. "09:00 - 17:00" - one per slot that day. */
  termini: string[];
}

export interface EmployeeAdminDetail {
  id: string;
  korisnik: { imePrezime: string; email: string | null; telefon: string | null };
  povezaniEkspert: EmployeeAdminLinkedExpert | null;
  /** Service NAMES, display only - not ids, unlike EmployeeEditPayload.services. */
  usluge: string[];
  radnoVreme: EmployeeAdminWorkingHoursDisplay[];
  nacinIsplate: 'Provizija' | 'Fiksna plata';
  procenatProvizije: string | null;
  aktivan: 'Da' | 'Ne';
  napomena: string | null;
  googleCalendarId: string | null;
  sredimeIcsUrl: string | null;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (3) Edit / write shape (mapEmployeeForEdit) ----

export interface EmployeeWorkingHoursEntry {
  day: EmployeeWeekDay;
  slots: { from: string; to: string }[];
}

export interface EmployeeEditPayload {
  id?: string;
  /** Display-only, for the form's title/breadcrumb - not a form field. */
  imePrezime?: string;
  email?: string | null;
  /** REQUIRED on create, not editable after creation (omitted from the update
   * payload entirely - see admin-employee-form's header comment). */
  userId: string;
  expert?: string | null;
  services?: string[];
  workingHours?: EmployeeWorkingHoursEntry[];
  payType?: EmployeePayType;
  commissionRate?: number | null;
  isActive?: boolean;
  notes?: string;
  googleCalendarId?: string;
  sredimeIcsUrl?: string;
}
