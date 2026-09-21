// Mirrors GET/POST /api/v1/me/addresses, PUT .../:id/default, DELETE .../:id -
// the logged-in user's own saved shipping addresses. No dedicated edit endpoint
// exists on the backend for this v1 pass, so the UI's only path to change an
// address is delete + re-add (see account-addresses component).

export interface MyAddress {
  id: string;
  naziv: string | null;
  grad: string;
  postanskiBroj: string;
  ulica: string;
  broj: string;
  podrazumevana: boolean;
}

/** Body for POST /me/addresses - label and isDefault optional. */
export interface AddressCreatePayload {
  label?: string;
  city: string;
  postalCode: string;
  street: string;
  number: string;
  isDefault?: boolean;
}
