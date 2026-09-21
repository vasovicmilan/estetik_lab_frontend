import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Auth } from '../../../../core/services/auth';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { Cart } from '../../services/cart';
import { ProductPublicDetail, ProductVariantDisplay } from '../../models/product';

/**
 * Pure display component - receives its data from productDetailResolver via
 * withComponentInputBinding(), same pattern as service-detail. The one bit of
 * local state is the selected variant + quantity for the "Dodaj u korpu" flow.
 * Cart is auth-only (see cart.ts's header comment) - the add button is disabled
 * and shows a login link instead of ever calling the cart API while logged out,
 * since that would just 401.
 */
@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private auth = inject(Auth);
  private cart = inject(Cart);
  private snackBar = inject(MatSnackBar);

  product = input<ProductPublicDetail | null>(null);

  selectedVariantId = signal<string | null>(null);
  quantity = signal(1);
  addingToCart = signal(false);

  isLoggedIn = computed(() => this.auth.currentUser() !== null);

  selectedVariant = computed<ProductVariantDisplay | null>(() => {
    const product = this.product();
    if (!product) return null;
    const id = this.selectedVariantId() ?? product.varijante[0]?.id ?? null;
    return product.varijante.find((v) => v.id === id) ?? null;
  });

  selectVariant(variant: ProductVariantDisplay): void {
    this.selectedVariantId.set(variant.id);
  }

  setQuantity(value: number): void {
    this.quantity.set(Math.min(99, Math.max(1, Math.floor(value) || 1)));
  }

  addToCart(): void {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant || !this.isLoggedIn()) return;

    this.addingToCart.set(true);
    this.cart
      .addItem(product.id, variant.id, this.quantity())
      .pipe(finalize(() => this.addingToCart.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Proizvod je dodat u korpu.', 'U redu', { duration: 3000 }),
        error: () => this.snackBar.open('Dodavanje u korpu nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
