// Mirrors GET /api/v1/me/orders(/:id) on the backend - the logged-in user's OWN
// orders only. Deliberately a separate, simpler shape from the admin feature's
// OrderAdminListItem/OrderAdminDetail (features/orders/models/order.ts): no
// client info (it IS the client), no cancel-token/who-cancelled audit fields,
// no timeline block. Do not import from the admin feature.

import { ImageDisplay } from '../../../core/models/upload';

export type MyOrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

// ---- List row - GET /me/orders ----

export interface MyOrderListItem {
  id: string;
  brojStavki: number;
  /** Formatted money, or null. */
  ukupnaCena: string | null;
  status: string;
  statusRaw: MyOrderStatus;
  datum: string;
}

// ---- Detail - GET /me/orders/:id ----

export interface MyOrderAddress {
  grad: string;
  postanskiBroj: string;
  ulica: string;
  broj: string;
}

export interface MyOrderLineItem {
  productId: string;
  variantId?: string;
  naziv: string;
  varijanta?: string;
  sku: string | null;
  /** Raw number - this app has no currency pipe, render with " RSD" appended
   * (same convention as the admin temporary-orders detail page). */
  cena: number;
  kolicina: number;
  ukupno: number;
  slika: ImageDisplay | null;
}

export interface MyOrderDetail {
  id: string;
  adresa: MyOrderAddress | null;
  stavke: MyOrderLineItem[];
  /** Raw number - append " RSD" when rendering. */
  subtotal: number;
  /** Raw number - append " RSD" when rendering (unless zahtevaProceenuDostave). */
  dostava: number;
  zahtevaProceenuDostave: boolean;
  kupon: string | null;
  /** Raw number - append " RSD" when rendering. */
  popust: number;
  /** Pre-formatted, unlike subtotal/dostava/popust - render as-is, no " RSD" suffix. */
  ukupnaCena: string | null;
  napomena: string | null;
  status: string;
  statusRaw: MyOrderStatus;
  razlogOtkazivanja: string | null;
  datum: string;
}

// ---- Action payloads ----

/** Body for POST .../cancel - optional free-text reason (max 500 chars). */
export interface MyOrderCancelPayload {
  reason?: string;
}
