import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { MyOrder } from '../../services/my-order';
import { MyOrderDetail } from '../../models/order';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** Read+act view of GET /me/orders/:id - own-order detail (item table with
 * thumbnails, price breakdown) and cancel (inline reason textarea), shown only
 * when statusRaw is 'pending' or 'processing' - a shipped/delivered/etc order
 * can no longer be self-cancelled by the customer, mirroring the customer-
 * appropriate subset of the admin order detail's status-gated cancel button.
 * Mounted at /moj-nalog/porudzbine/:id. */
@Component({
  selector: 'app-account-order-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './account-order-detail.html',
  styleUrl: './account-order-detail.scss',
})
export class AccountOrderDetail implements OnInit {
  private myOrder = inject(MyOrder);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  orderId = signal<string | null>(null);
  detail = signal<MyOrderDetail | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  cancelling = signal(false);
  cancelReason = signal('');

  canCancel(detail: MyOrderDetail): boolean {
    return detail.statusRaw === 'pending' || detail.statusRaw === 'processing';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.orderId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.orderId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.myOrder
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.notFound.set(true),
      });
  }

  toggleCancel(): void {
    this.cancelling.set(!this.cancelling());
    this.cancelReason.set('');
  }

  submitCancel(): void {
    const id = this.orderId();
    if (!id) return;

    this.acting.set(true);
    this.myOrder
      .cancel(id, this.cancelReason().trim() || undefined)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Porudžbina je otkazana.', 'U redu', { duration: 3000 });
          this.cancelling.set(false);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Otkazivanje porudžbine nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
