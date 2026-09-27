import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Cart } from '../../services/cart';
import { OrderConfirmDetail } from '../../models/cart';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/**
 * Reached from the order-confirmation email (buildLink("orderConfirm", ...) in
 * email.service.js -> GET /api/v1/orders/:orderId/confirm/:token). Guest or
 * logged-in, it doesn't matter - the (orderId, token) pair in the URL is the
 * whole credential, same "fire on load, no form" pattern as verify-account and
 * newsletter-unsubscribe. On success the TemporaryOrder has just been turned
 * into a real Order server-side, so this shows the same item/total breakdown
 * as the account feature's own order detail (see AccountOrderDetail, whose
 * markup this mirrors) - no cancel action here, though: that's an account-only
 * capability once you're looking at your own order list, not something offered
 * off a one-shot email link.
 * Mounted at /korpa/potvrda/:orderId/:token (see app.routes.ts).
 */
@Component({
  selector: 'app-order-confirm',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './order-confirm.html',
  styleUrl: './order-confirm.scss',
})
export class OrderConfirm implements OnInit {
  private cart = inject(Cart);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  order = signal<OrderConfirmDetail | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    const token = this.route.snapshot.paramMap.get('token');
    if (!orderId || !token) {
      this.loading.set(false);
      this.errorMessage.set('Link za potvrdu porudžbine nije ispravan.');
      return;
    }

    this.cart.confirmOrder(orderId, token).subscribe({
      next: (order) => {
        this.loading.set(false);
        this.order.set(order);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.message || 'Potvrda porudžbine nije uspela. Link je možda istekao ili je već iskorišćen.');
      },
    });
  }
}
