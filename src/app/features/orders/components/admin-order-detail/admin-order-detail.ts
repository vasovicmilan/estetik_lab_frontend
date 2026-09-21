import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, finalize } from 'rxjs';
import { Order } from '../../services/order';
import { OrderAdminDetail as OrderAdminDetailModel } from '../../models/order';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** Reason-collecting actions - each shows a small inline expanding text field
 * instead of a prompt()/dialog, same "no dialog library" pattern as
 * admin-appointment-detail.ts. Only one can be open at a time. */
type ReasonAction = 'cancel' | 'return';

/** Rich read+act view of GET /admin/orders/:orderId - client info, address, line
 * items, price breakdown, status + status-transition action buttons, an inline
 * contact/address edit. Mounted at /admin/porudzbine/:id.
 *
 * Status-transition buttons by current status, following the natural order
 * lifecycle pending -> processing -> shipped -> delivered -> completed:
 *  - pending:    process, cancel
 *  - processing: ship, cancel
 *  - shipped:    deliver, cancel
 *  - delivered:  complete, return, refund, cancel
 *  - completed:  return, refund
 *  - cancelled/returned/refunded: reopen (undo, back to a workable state)
 * cancel is offered on every non-terminal status (pending/processing/shipped/
 * delivered); return/refund only once the order has actually reached the
 * customer (delivered/completed). */
@Component({
  selector: 'app-admin-order-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-order-detail.html',
  styleUrl: './admin-order-detail.scss',
})
export class AdminOrderDetail implements OnInit {
  private order = inject(Order);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  orderId = signal<string | null>(null);
  detail = signal<OrderAdminDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  /** Which reason-collecting action's inline text field is currently open. */
  reasonAction = signal<ReasonAction | null>(null);
  reasonText = signal('');

  /** Inline "Izmeni kontakt" form - closed by default, opened on demand. */
  editingContact = signal(false);
  contactPhone = signal('');
  contactCity = signal('');
  contactPostalCode = signal('');
  contactStreet = signal('');
  contactNumber = signal('');

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
    this.order
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.contactPhone.set(detail.korisnik.telefon ?? '');
          this.contactCity.set(detail.adresa?.grad ?? '');
          this.contactPostalCode.set(detail.adresa?.postanskiBroj ?? '');
          this.contactStreet.set(detail.adresa?.ulica ?? '');
          this.contactNumber.set(detail.adresa?.broj ?? '');
        },
        error: () => this.notFound.set(true),
      });
  }

  // ---- Simple no-body transitions ----

  markProcessing(): void {
    this.runAction(this.order.markProcessing(this.orderId()!), 'Porudžbina je označena kao u obradi.');
  }

  markShipped(): void {
    this.runAction(this.order.markShipped(this.orderId()!), 'Porudžbina je označena kao poslata.');
  }

  markDelivered(): void {
    this.runAction(this.order.markDelivered(this.orderId()!), 'Porudžbina je označena kao dostavljena.');
  }

  markCompleted(): void {
    this.runAction(this.order.markCompleted(this.orderId()!), 'Porudžbina je označena kao završena.');
  }

  markRefunded(): void {
    this.runAction(this.order.markRefunded(this.orderId()!), 'Porudžbina je refundirana.');
  }

  reopen(): void {
    this.runAction(this.order.reopen(this.orderId()!), 'Porudžbina je ponovo otvorena.');
  }

  // ---- Reason-collecting transitions ----

  toggleReasonAction(action: ReasonAction): void {
    this.reasonAction.set(this.reasonAction() === action ? null : action);
    this.reasonText.set('');
  }

  submitReasonAction(): void {
    const action = this.reasonAction();
    const id = this.orderId();
    if (!action || !id) return;

    const reason = this.reasonText().trim() || undefined;
    let request$: Observable<unknown>;
    let message: string;
    switch (action) {
      case 'cancel':
        request$ = this.order.cancel(id, reason);
        message = 'Porudžbina je otkazana.';
        break;
      case 'return':
        request$ = this.order.markReturned(id, reason);
        message = 'Porudžbina je označena kao vraćena.';
        break;
      default:
        return;
    }

    this.reasonAction.set(null);
    this.runAction(request$, message);
  }

  // ---- Contact edit ----

  toggleEditContact(): void {
    this.editingContact.set(!this.editingContact());
  }

  submitContact(): void {
    const id = this.orderId();
    if (!id) return;

    this.acting.set(true);
    this.order
      .updateContact(id, {
        phone: this.contactPhone().trim() || undefined,
        address: {
          city: this.contactCity().trim() || undefined,
          postalCode: this.contactPostalCode().trim() || undefined,
          street: this.contactStreet().trim() || undefined,
          number: this.contactNumber().trim() || undefined,
        },
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Kontakt podaci su ažurirani.', 'U redu', { duration: 3000 });
          this.editingContact.set(false);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena kontakta nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Shared action runner ----

  private runAction(request$: Observable<unknown>, successMessage: string): void {
    this.acting.set(true);
    request$.pipe(finalize(() => this.acting.set(false))).subscribe({
      next: () => {
        this.snackBar.open(successMessage, 'U redu', { duration: 3000 });
        this.load();
      },
      error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
    });
  }
}
