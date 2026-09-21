// Mirrors GET /api/v1/me/appointments(/:id) on the backend - the logged-in
// user's OWN appointments only. Deliberately a separate, simpler shape from the
// admin feature's AppointmentAdminListItem/AppointmentAdminDetail
// (features/appointments/models/appointment.ts): no client info (it IS the
// client), no therapist-reassignment/audit-trail fields, no manual-creation
// payloads. Do not import from the admin feature - these are different backend
// endpoints with different response shapes.

export type MyAppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';

// ---- List row - GET /me/appointments ----

export interface MyAppointmentListItem {
  id: string;
  usluga: string;
  /** Formatted display date/time. */
  datum: string;
  /** Raw ISO instant - used client-side to group into Danas/Predstojeći/Prošli. */
  startTimeRaw: string;
  /** Serbian-translated status label. */
  status: string;
  /** Formatted money, or null. */
  cena: string | null;
}

// ---- Detail - GET /me/appointments/:id ----

export interface MyAppointmentDetail {
  id: string;
  usluga: { naziv: string; trajanje: string | null; cena: string | null };
  termin: { pocetak: string; kraj: string; pocetakRaw: string };
  status: string;
  statusRaw: MyAppointmentStatus;
  /** Therapist name, or "Nije dodeljen" when none assigned yet. */
  terapeut: string;
  napomena: string | null;
  popust: string | null;
  konacnaCena: string | null;
  kupon: string | null;
  createdAt: string;
  /** Set only when statusRaw is 'rejected'. */
  razlogOdbijanja: string | null;
  /** Set only when statusRaw is 'cancelled'. */
  razlogOtkazivanja: string | null;
}

// ---- Action payloads ----

/** Body for POST .../cancel - optional free-text reason (max 500 chars). */
export interface MyAppointmentCancelPayload {
  reason?: string;
}

/** Body for POST .../reschedule - a naive "YYYY-MM-DDTHH:mm" string with NO
 * timezone suffix, exactly what a native <input type="datetime-local"> produces.
 * Do NOT convert to ISO/UTC client-side - same convention as the admin
 * appointment reschedule (AppointmentReschedulePayload). */
export interface MyAppointmentReschedulePayload {
  newStartTime: string;
}
