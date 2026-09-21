import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Cart as CartModel, CheckoutPayload, CheckoutResponse } from '../models/cart';

/**
 * All of cart.routes.js sits behind apiAuthMiddleware - unlike booking, there's no
 * guest cart, so every method here should only ever be called while Auth.currentUser()
 * is set. Callers (cart/checkout components, and the "Dodaj u korpu" button on
 * product-detail) are responsible for gating that, since a 401 here isn't recoverable
 * with a retry the way a validation error is.
 */
@Injectable({ providedIn: 'root' })
export class Cart {
  private api = inject(Api);

  get(): Observable<CartModel> {
    return this.api.get<CartModel>('cart');
  }

  addItem(productId: string, variantId: string, quantity = 1): Observable<CartModel> {
    return this.api.post<CartModel>('cart/items', { productId, variantId, quantity });
  }

  /** quantity 0 removes the line (see cart.routes.js's PUT /cart/items). */
  updateItem(cartItemId: string, quantity: number): Observable<CartModel> {
    return this.api.put<CartModel>('cart/items', { cartItemId, quantity });
  }

  removeItem(cartItemId: string): Observable<CartModel> {
    return this.api.deleteWithBody<CartModel>('cart/items', { cartItemId });
  }

  checkout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>('orders/checkout', payload);
  }
}
