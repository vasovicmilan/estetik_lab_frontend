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
