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
import { AdminPayoutRequest } from '../../services/payout-request';
import { PayoutRequestAdminDetail } from '../../models/payout-request';

/** Which reason-collecting action's inline text field is currently open. Only
 * one at a time - same "no dialog library" inline-textarea pattern as
 * admin-appointment-detail's ReasonAction (see that component's header
 * comment; no confirm-with-reason MatDialog exists anywhere in this app to
 * reuse instead). */
type PayoutAction = 'approve' | 'pay' | 'reject';

/** Detail + status-transition actions for GET /admin/payout-requests/:requestId.
 * No separate edit form exists for a payout request - `:id` IS the detail/action
 * page (see payouts.routes.ts's header comment). Mounted at /admin/isplate/:id. */
@Component({
  selector: 'app-admin-payout-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './admin-payout-detail.html',
  styleUrl: './admin-payout-detail.scss',
})
export class AdminPayoutDetail implements OnInit {
  private payoutRequest = inject(AdminPayoutRequest);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  requestId = signal<string | null>(null);
  detail = signal<PayoutRequestAdminDetail | null>(null);
  loading = signal(false);
  acting = signal(false);

  reasonAction = signal<PayoutAction | null>(null);
  reasonText = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.requestId.set(id);
    this.load();
  }

  get canApprove(): boolean {
    return this.detail()?.statusRaw === 'requested';
  }

  get canPay(): boolean {
    const status = this.detail()?.statusRaw;
    return status === 'requested' || status === 'approved';
  }

  get canReject(): boolean {
    return this.detail()?.statusRaw !== 'paid';
  }

  private load(): void {
    const id = this.requestId();
    if (!id) return;

    this.loading.set(true);
    this.payoutRequest
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju zahteva za isplatu.', 'U redu', { duration: 4000 }),
      });
  }

  toggleReasonAction(action: PayoutAction): void {
    this.reasonAction.set(this.reasonAction() === action ? null : action);
    this.reasonText.set('');
  }

  submitReasonAction(): void {
    const action = this.reasonAction();
    const id = this.requestId();
    if (!action || !id) return;

    const reason = this.reasonText().trim() || undefined;
    let request$: Observable<PayoutRequestAdminDetail>;
    let message: string;
    switch (action) {
      case 'approve':
        request$ = this.payoutRequest.approve(id, { reason });
        message = 'Zahtev za isplatu je odobren.';
        break;
      case 'pay':
        request$ = this.payoutRequest.pay(id, { reason });
        message = 'Isplata je označena kao izvršena.';
        break;
      case 'reject':
        request$ = this.payoutRequest.reject(id, { reason });
        message = 'Zahtev za isplatu je odbijen.';
        break;
      default:
        return;
    }

    this.reasonAction.set(null);
    this.acting.set(true);
    request$.pipe(finalize(() => this.acting.set(false))).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.snackBar.open(message, 'U redu', { duration: 3000 });
      },
      error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
    });
  }
}
