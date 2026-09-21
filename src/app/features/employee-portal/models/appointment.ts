// Mirrors GET /api/v1/employee/appointments(/:id) on the backend - the logged-in
// EMPLOYEE's own assigned appointments. Deliberately a third, separate shape from
// both the admin feature's AppointmentAdminListItem/AppointmentAdminDetail
// (features/appointments/models/appointment.ts, full admin view with reassignment/
// audit trail) and the account feature's MyAppointmentListItem/MyAppointmentDetail
// (features/account/models/appointment.ts, the CLIENT's own bookings) - same
// underlying appointment states, three different actors, three different action
// sets. Do not import from either of those features.

export type EmployeeAppointmentStatusRaw = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'no_show' | 'cancelled';

// ---- List row - GET /employee/appointments ----

export interface EmployeeAppointmentListItem {
  id: string;
  klijent: string;
  usluga: string;
  /** Formatted display date/time. */
  datum: string;
  /** Serbian-translated status label, e.g. "Na čekanju", "Potvrđen". */
  status: string;
  /** Formatted money, or null. */
  cena: string | null;
}

// ---- Detail - GET /employee/appointments/:id ----

export interface EmployeeAppointmentDetail {
  id: string;
  klijent: { ime: string; email: string | null; telefon: string | null };
  usluga: { naziv: string; trajanje: string | null; cena: string | null };
  termin: { pocetak: string; kraj: string; pocetakRaw: string };
  status: string;
  statusRaw: EmployeeAppointmentStatusRaw;
  napomenaKlijenta: string | null;
  konacnaCena: string | null;
  /** "Direktno zakazan" | "Dodeljen (Administrator)" | "Dodeljen (Korisnik)" -
   * informational only, not used for any client-side logic. */
  mojaUloga: string;
}

// ---- Action payloads ----

/** Body for POST .../reject - required free-text reason (mirrors the admin
 * appointment reject convention: max 500 chars, but here the backend requires
 * a non-empty value rather than treating it as optional). */
export interface EmployeeAppointmentRejectPayload {
  reason: string;
}

/** Body for POST .../no-show - required free-text note, same convention as reject. */
export interface EmployeeAppointmentNoShowPayload {
  note: string;
}

/** Body for POST .../reschedule - a naive "YYYY-MM-DDTHH:mm" string with NO
 * timezone suffix, exactly what a native <input type="datetime-local"> produces.
 * Do NOT convert to ISO/UTC client-side - same convention as every other
 * reschedule in this app (AppointmentReschedulePayload, MyAppointmentReschedulePayload). */
export interface EmployeeAppointmentReschedulePayload {
  newStartTime: string;
}
