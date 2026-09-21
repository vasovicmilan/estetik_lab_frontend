import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { AddressCreatePayload, MyAddress } from '../models/address';

/** Named `Address` - the logged-in user's own saved addresses (/me/addresses).
 * No admin equivalent exists yet, so no naming collision to avoid, but kept
 * inside the `account` feature since it's part of the same self-service area. */
@Injectable({ providedIn: 'root' })
export class Address {
  private api = inject(Api);

  list(): Observable<MyAddress[]> {
    return this.api.get<MyAddress[]>('me/addresses');
  }

  /** Returns the FULL updated address list, not just the new one. */
  add(payload: AddressCreatePayload): Observable<MyAddress[]> {
    return this.api.post<MyAddress[]>('me/addresses', payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`me/addresses/${id}`);
  }

  setDefault(id: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`me/addresses/${id}/default`, {});
  }
}
