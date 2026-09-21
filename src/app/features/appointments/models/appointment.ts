// Mirrors mapAppointmentForAdminShort / mapAppointmentForAdminDetail on the backend
// (see admin-appointments.controller.js) - same Serbian-keyed, pre-formatted DISPLAY
// shapes as service.ts's ServiceListItem/ServiceDetail split (read this file's
// header comment for why the app keeps that split rather than flattening it).

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';

// ---- Admin list row - GET /admin/appointments ----

export interface AppointmentAdminListItem {
  id: string;
  korisnik: string;
  usluga: string;
  datum: string;
  status: string;
  statusRaw: AppointmentStatus;
  konacnaCena: string;
}

// ---- Admin detail - GET /admin/appointments/:id ----

export interface AppointmentAdminDetail {
  id: string;
  korisnik: { ime: string; email: string | null; telefon: string | null };
  usluga: { id: string | null; naziv: string; trajanje: string | null; cena: string | null };
  termin: { pocetak: string; kraj: string; pocetakRaw: string; krajRaw: string };
  status: string;
  statusRaw: AppointmentStatus;
  terapeutId: string | null;
  terapeut: string | null;
  dodeljenTerapeut: string | null;
  napomena: string | null;
  popust: string | null;
  konacnaCena: string | null;
  kupon: string | null;
  rucnoKreiran: boolean;
  odbio: string | null;
  odbijenU: string | null;
  razlogOdbijanja: string | null;
  oznacioNeDosao: string | null;
  neDosaoU: string | null;
  napomenaNeDosao: string | null;
  potvrdio: string | null;
  potvrdjenU: string | null;
  dodelio: string | null;
  dodeljenU: string | null;
  otkazao: string | null;
  otkazanU: string | null;
  razlogOtkazivanja: string | null;
  createdAt: string;
  updatedAt: string;
  // Added by the API layer on top of the base mapper - therapists who could
  // actually be reassigned this appointment (on shift, not double-booked).
  eligibleEmployeeIds: string[];
}

// ---- Action payloads ----

/** Body for reject/cancel/no-show - all three accept an optional free-text reason/note. */
export interface AppointmentActionReason {
  reason?: string;
}

export interface AppointmentNoShowNote {
  note?: string;
}

export interface AppointmentReassignPayload {
  employeeId: string;
}

/** Body for PUT .../reschedule - a naive "YYYY-MM-DDTHH:mm" string with NO timezone
 * suffix, exactly what a native <input type="datetime-local"> produces. Do NOT
 * convert to ISO/UTC client-side - the backend does the Belgrade-timezone
 * conversion itself. */
export interface AppointmentReschedulePayload {
  newStartTime: string;
}

/** Body for POST /admin/appointments/manual. Unlike reschedule's newStartTime,
 * startTime here IS a full ISO instant (built client-side from a picked slot via
 * `new Date(value).toISOString()`), matching BookingConfirmPayload's shape. */
export interface ManualAppointmentPayload {
  serviceId: string;
  servicePackageId: string;
  employeeId?: string;
  startTime: string;
  existingUserId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  note?: string;
  priceOverride?: number;
  packagePurchaseId?: string;
}

export interface ManualAppointmentResponse {
  appointment: { id: string; [key: string]: unknown };
}

// ---- Minimal employee shape for the reassign/manual-create pickers - GET
// /admin/employees. No dedicated Employee feature exists yet (see this feature's
// header comment / the task spec); this is intentionally the bare minimum. ----

export interface EmployeePickerItem {
  id: string;
  imePrezime: string;
  email: string;
  aktivan: 'Da' | 'Ne';
  brojUsluga: number;
  kreiran: string;
}
