// Mirrors partner.mapper.js exactly. A Partner links an existing User to the
// affiliate/referral program (commission rates on services/products bookings) -
// permission `manage_partners`, module `partners`. Same three-shape split as
// Category/Employee:
//
// 1. PartnerAdminListItem - GET /admin/partners             (mapPartnersForAdminList)
// 2. PartnerAdminDetail    - GET /admin/partners/:id          (mapPartnerForAdminDetail)
// 3. PartnerEditPayload    - GET /admin/partners/:id/edit, and the body of POST/PUT (mapPartnerForEdit)

// ---- (1) Admin list row ----

export interface PartnerAdminListItem {
  id: string;
  imePrezime: string;
  email: string | null;
  procenatProvizijeUsluge: string; // e.g. "10%"
  procenatProvizijeArtikli: string;
  aktivan: string; // "Da" | "Ne"
  kreiran: string; // formatted date
}

// ---- (2) Admin detail (display only) - NOT the shape admin-partner-form posts back ----

export interface PartnerAdminDetail {
  id: string;
  korisnik: { imePrezime: string; email: string | null; telefon: string | null };
  procenatProvizijeUsluge: string;
  procenatProvizijeUslugeRaw: number;
  procenatProvizijeArtikli: string;
  procenatProvizijeArtikliRaw: number;
  maxProvizijaUsluge: string; // formatted money or "Bez ograničenja"
  maxProvizijaArtikli: string;
  aktivan: string;
  napomena: string | null;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (3) Edit / write shape (mapPartnerForEdit) ----

export interface PartnerEditPayload {
  id: string;
  imePrezime: string;
  email: string | null;
  userId: string;
  commissionRateServices: number;
  commissionRateProducts: number;
  maxCommissionAmountServices: number | null;
  maxCommissionAmountProducts: number | null;
  isActive: boolean;
  notes: string;
}

// ---- Create/update payloads actually POSTed/PUT ----

/** userId REQUIRED on create (auto-promotes that user's role - see the backend's
 * createPartner). Same idea as EmployeeEditPayload/EmployeeCreate split. */
export interface PartnerCreatePayload {
  userId: string;
  commissionRateServices: number;
  commissionRateProducts: number;
  maxCommissionAmountServices?: number | null;
  maxCommissionAmountProducts?: number | null;
  isActive?: boolean;
  notes?: string;
}

/** userId can't change on an existing partner - never sent on update (mirrors
 * Employee.update()'s Omit<EmployeeEditPayload, 'userId'>). */
export type PartnerUpdatePayload = Omit<PartnerCreatePayload, 'userId'>;
