import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { TemporaryOrder } from '../../services/temporary-order';
import { TemporaryOrderAdminDetail as TemporaryOrderAdminDetailModel } from '../../models/temporary-order';

/** Read+act view of GET /admin/temporary-orders/:id - contact/address/items/
 * pricing, a shipping-quote input (only shown while a freight quote is pending
 * and the token hasn't expired), and a "Potvrdi porudžbinu" action that creates
 * the real Order. Mounted at /admin/privremene-porudzbine/:id/pregled.
 *
 * No status-transition button row like admin-order-detail.ts - a temporary order
 * only has two possible admin actions (set shipping, confirm), not a status
 * lifecycle, so this stays much simpler than the Order feature's detail view. */
@Component({
  selector: 'app-admin-temporary-order-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './admin-temporary-order-detail.html',
  styleUrl: './admin-temporary-order-detail.scss',
})
export class AdminTemporaryOrderDetail implements OnInit {
  private temporaryOrder = inject(TemporaryOrder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  orderId = signal<string | null>(null);
  detail = signal<TemporaryOrderAdminDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  shippingAmount = signal<number | null>(null);

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
    this.temporaryOrder
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.shippingAmount.set(detail.dostava || null);
        },
        error: () => this.notFound.set(true),
      });
  }

  saveShipping(): void {
    const id = this.orderId();
    const amount = this.shippingAmount();
    if (!id || amount == null || amount < 0) return;

    this.acting.set(true);
    this.temporaryOrder
      .setShipping(id, amount)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Cena dostave je sačuvana.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje cene dostave nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  confirm(): void {
    const id = this.orderId();
    if (!id) return;
    if (!confirm('Potvrditi ovu porudžbinu u ime klijenta? Ova radnja kreira novu porudžbinu.')) return;

    this.acting.set(true);
    this.temporaryOrder
      .confirm(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Porudžbina je potvrđena.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/porudzbine']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Potvrda porudžbine nije uspela.', 'U redu', { duration: 4000 }),
      });
  }
}
