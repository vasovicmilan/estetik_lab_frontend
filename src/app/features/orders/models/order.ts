// Mirrors mapOrdersForAdminList / mapOrderForAdminDetail on the backend (see
// order.mapper.js) - same Serbian-keyed, pre-formatted DISPLAY shapes as
// appointment.ts's split (read that file's header comment for why the app
// keeps this split rather than flattening it).

import { ImageDisplay } from '../../../core/models/upload';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

// ---- Admin list row - GET /admin/orders ----

export interface OrderAdminListItem {
  id: string;
  korisnik: string;
  brojStavki: number;
  ukupnaCena: string;
  status: string;
  statusRaw: OrderStatus;
  datum: string;
}

// ---- Admin detail - GET /admin/orders/:orderId ----

export interface OrderAdminAddress {
  grad: string;
  postanskiBroj: string;
  ulica: string;
  broj: string;
}

export interface OrderAdminLineItem {
  productId: string | undefined;
  variantId: string | undefined;
  naziv: string;
  varijanta: string;
  sku: string | null;
  cena: number;
  kolicina: number;
  ukupno: number;
  slika: ImageDisplay | null;
}

export interface OrderAdminDetail {
  id: string;
  korisnik: { ime: string; email: string | null; telefon: string | null };
  adresa: OrderAdminAddress | null;
  stavke: OrderAdminLineItem[];
  subtotal: number;
  dostava: number;
  zahtevaProceenuDostave: boolean;
  kupon: string | null;
  popust: number;
  ukupnaCena: string | null;
  napomena: string | null;
  status: string;
  statusRaw: OrderStatus;
  cancelToken: string | null;
  otkazao: string | null;
  otkazaoRaw: 'user' | 'admin' | null;
  otkazanoU: string | null;
  razlogOtkazivanja: string | null;
  razlogVracanja: string | null;
  vreme: {
    naruceno: string;
    uObradiOd: string | null;
    poslatoU: string | null;
    dostavljenoU: string | null;
    zavrsenoU: string | null;
    vracenoU: string | null;
    refundiranoU: string | null;
  };
}

// ---- Action payloads ----

/** Body for return/cancel - both accept an optional free-text reason (max 500). */
export interface OrderActionReason {
  reason?: string;
}

/** Body for PUT .../contact - every field optional/partial, only what's being changed
 * needs to be sent. */
export interface OrderContactUpdatePayload {
  phone?: string;
  address?: {
    city?: string;
    postalCode?: string;
    street?: string;
    number?: string;
  };
}
