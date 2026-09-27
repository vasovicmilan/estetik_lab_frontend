import { ImageDisplay } from '../../../core/models/upload';

// Mirrors mapUserCart's shape (see cart.mapper.js). Cart is auth-only - unlike
// booking, there's no guest cart, so every route in cart.routes.js sits behind
// apiAuthMiddleware (see cart.ts's header comment).

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  variantId: string;
  naziv: string;
  varijanta: string;
  sku: string | null;
  cena: number;
  kolicina: number;
  ukupno: number;
  slika: ImageDisplay | null;
  naStanju: boolean;
  dostupnaKolicina: number;
  /** true if kolicina > dostupnaKolicina - show a warning, the line may not be fully fulfillable. */
  prekoracenje: boolean;
}

export interface Cart {
  stavke: CartLine[];
  brojStavki: number;
  ukupnaCena: number;
  /** true if any line has a "freight" shippingClass product - don't show a shipping
   * price when this is true, show "Cena dostave se procenjuje ručno" instead. */
  zahtevaProceenuDostave: boolean;
  /** Flat shipping price - only meaningful when zahtevaProceenuDostave is false. */
  postarina: number | null;
}

// Matches validateCheckout exactly (see order.validator.js).
export interface CheckoutPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  city: string;
  postalCode: string;
  street: string;
  number: string;
  note?: string;
  couponCode?: string;
}

export interface CheckoutResponse {
  orderId: string;
  email: string;
  tokenExpiration: string;
  requiresShippingQuote: boolean;
}

// ---- Order confirmation - GET /orders/:orderId/confirm/:token ----
// Mirrors mapOrderForUserDetail's shape (order.mapper.js) - same "user, detail"
// view the logged-in customer gets from GET /me/orders/:id (see the account
// feature's MyOrderDetail), just reached via the emailed confirmation link
// instead of a logged-in session, since checkout can be done as a guest.

export interface OrderConfirmAddress {
  grad: string;
  postanskiBroj: string;
  ulica: string;
  broj: string;
}

export interface OrderConfirmLineItem {
  productId: string;
  variantId?: string;
  naziv: string;
  varijanta?: string;
  sku: string | null;
  /** Raw number - append " RSD" when rendering. */
  cena: number;
  kolicina: number;
  ukupno: number;
  slika: ImageDisplay | null;
}

export interface OrderConfirmDetail {
  id: string;
  adresa: OrderConfirmAddress | null;
  stavke: OrderConfirmLineItem[];
  subtotal: number;
  dostava: number;
  zahtevaProceenuDostave: boolean;
  kupon: string | null;
  popust: number;
  /** Pre-formatted, unlike subtotal/dostava/popust - render as-is, no " RSD" suffix. */
  ukupnaCena: string | null;
  napomena: string | null;
  status: string;
  statusRaw: string;
  datum: string;
}
