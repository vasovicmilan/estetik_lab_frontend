import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Auth } from '../../../../core/services/auth';
import { Cart as CartService } from '../../services/cart';
import { Cart as CartModel } from '../../models/cart';

/**
 * /korpa - cart is auth-only (see cart.ts's header comment): while logged out this
 * shows a login prompt instead of ever calling GET /cart, which would just 401.
 */
@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private auth = inject(Auth);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  isLoggedIn = signal(this.auth.currentUser() !== null);
  cart = signal<CartModel | null>(null);
  loading = signal(false);
  updatingLineId = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.isLoggedIn()) return;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cartService
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: () => this.snackBar.open('Greška pri učitavanju korpe.', 'U redu', { duration: 4000 }),
      });
  }

  changeQuantity(lineId: string, quantity: number): void {
    this.updatingLineId.set(lineId);
    this.cartService
      .updateItem(lineId, Math.max(0, quantity))
      .pipe(finalize(() => this.updatingLineId.set(null)))
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: () => this.snackBar.open('Izmena količine nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  removeLine(lineId: string): void {
    this.updatingLineId.set(lineId);
    this.cartService
      .removeItem(lineId)
      .pipe(finalize(() => this.updatingLineId.set(null)))
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: () => this.snackBar.open('Brisanje stavke nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  goToCheckout(): void {
    this.router.navigate(['/korpa/placanje']);
  }
}
