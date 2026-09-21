// Mirrors booking.controller.js exactly (GET /booking/:serviceSlug/slots,
// POST /booking/confirm). Booking is a 2-call flow for an API client (browse slots,
// then confirm with everything included) rather than the web's 4-step session
// wizard - see booking.controller.js's own header comment.

// Matches mapEmployeeForPublic() (see employee.mapper.js on the backend) - the
// only employee shape ever sent over this endpoint.
export interface BookingEmployee {
  id: string;
  imePrezime: string;
  usluge: string[];
  radnoVreme: unknown;
}

export interface BookingSlot {
  startTime: string;
  endTime: string;
  employeeId: string | null;
}

export interface BookingUsablePackagePurchase {
  id: string;
  [key: string]: unknown;
}

export interface BookingSlotsResponse {
  service: { id: string; naziv: string; slug: string };
  variant: { id: string; naziv: string; cena: string; trajanje: string; [key: string]: unknown };
  date: string;
  employees: BookingEmployee[];
  slots: BookingSlot[];
  // Only present for logged-in callers - see getSlots()'s comment on the backend.
  usablePackagePurchase?: BookingUsablePackagePurchase | null;
}

export interface BookingConfirmPayload {
  serviceId: string;
  servicePackageId: string;
  employeeId?: string | null;
  startTime: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  note?: string;
  couponCode?: string;
  packagePurchaseId?: string | null;
  // Honeypot field (see spam.validator.js's validateHoneypot) - MUST stay empty,
  // never shown to or filled by a real visitor. Sent as-is (undefined/empty).
  nickname?: string;
}

export interface BookingConfirmResponse {
  appointment: {
    id: string;
    [key: string]: unknown;
  };
  accountJustCreated: boolean;
}

// GET /api/v1/booking/referral-code - the referral code captured from a
// ?code= link, if any (see coupon-capture.middleware.js on the backend). The
// cookie it lives in is httpOnly on purpose, so this is the only way the
// frontend can find out a code was captured, to pre-fill (not silently
// apply) the coupon field.
export interface BookingReferralCodeResponse {
  code: string | null;
}

// POST /api/v1/booking/coupon/check - read-only discount preview, does not
// redeem the coupon (that only happens inside confirmBooking's transaction).
export interface BookingCouponCheckResponse {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}
