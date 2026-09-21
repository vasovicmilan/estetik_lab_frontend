import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { MyOrder } from '../../services/my-order';
import { MyOrderListItem } from '../../models/order';

/** Flat list of GET /me/orders - simple card-per-order, no status filter UI in
 * this v1 pass (a small personal order history doesn't need it). Mounted at
 * /moj-nalog/porudzbine. */
@Component({
  selector: 'app-account-orders',
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './account-orders.html',
  styleUrl: './account-orders.scss',
})
export class AccountOrders implements OnInit {
  private myOrder = inject(MyOrder);
  private snackBar = inject(MatSnackBar);

  orders = signal<MyOrderListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.myOrder
      .list({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.orders.set(data),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje porudžbina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
