import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import { PartnerDashboardService } from '../../services/partner-dashboard';
import { PartnerCommissionService } from '../../services/partner-commission';
import { PartnerPayoutService } from '../../services/partner-payout';
import { PartnerBalance } from '../../models/dashboard';
import { PartnerCommissionEntry, PartnerCommissionSourceType, PartnerCommissionStatus } from '../../models/commission';
import { PartnerPayoutRequest, PartnerPayoutStatus } from '../../models/payout';

const SOURCE_TYPE_LABELS: Record<PartnerCommissionSourceType, string> = {
  appointment: 'Termin',
  order: 'Porudžbina',
  package_purchase: 'Paket',
};

const COMMISSION_STATUS_LABELS: Record<PartnerCommissionStatus, string> = {
  pending: 'Na čekanju',
  earned: 'Zarađeno',
  reversed: 'Stornirano',
};

const PAYOUT_STATUS_LABELS: Record<PartnerPayoutStatus, string> = {
  requested: 'Zatraženo',
  approved: 'Odobreno',
  paid: 'Isplaćeno',
  rejected: 'Odbijeno',
};

/**
 * "Provizije i isplate" - balance summary (reused from the dashboard's shape,
 * refetched here since this page is reachable independently), a commissions
 * history table, a payout-requests history table, and an inline "Zatraži
 * isplatu" form. Mirrors employee-earnings closely (see that component's
 * header comment) - the only difference is every partner sees this page (no
 * isCommissionBased gating in the nav, see PartnerShell).
 *
 * commissions/payouts are RAW/unformatted backend data (see commission.ts's and
 * payout.ts's header comments) - all translation/formatting (status labels,
 * source-type labels, " RSD" suffix, date) happens here, client-side.
 * Mounted at /partner-panel/zarade.
 */
@Component({
  selector: 'app-partner-earnings',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './partner-earnings.html',
  styleUrl: './partner-earnings.scss',
})
export class PartnerEarnings implements OnInit {
  private partnerDashboard = inject(PartnerDashboardService);
  private partnerCommission = inject(PartnerCommissionService);
  private partnerPayout = inject(PartnerPayoutService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  requesting = signal(false);

  balance = signal<PartnerBalance | null>(null);
  commissions = signal<PartnerCommissionEntry[]>([]);
  payouts = signal<PartnerPayoutRequest[]>([]);

  payoutAmount = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      dashboard: this.partnerDashboard.get(),
      commissions: this.partnerCommission.list({ limit: 50 }),
      payouts: this.partnerPayout.list({ limit: 50 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ dashboard, commissions, payouts }) => {
          this.balance.set(dashboard.balance);
          this.commissions.set(commissions.data);
          this.payouts.set(payouts.data);
        },
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje provizija nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  sourceTypeLabel(type: PartnerCommissionSourceType): string {
    return SOURCE_TYPE_LABELS[type] ?? type;
  }

  commissionStatusLabel(status: PartnerCommissionStatus): string {
    return COMMISSION_STATUS_LABELS[status] ?? status;
  }

  payoutStatusLabel(status: PartnerPayoutStatus): string {
    return PAYOUT_STATUS_LABELS[status] ?? status;
  }

  /** No date-pipe/locale-data convention exists elsewhere in this app to
   * mirror (same as employee-earnings), so this just formats with the
   * browser's own sr-RS locale support. */
  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
  }

  requestPayout(): void {
    const amount = this.payoutAmount();
    if (!amount || amount <= 0) return;

    this.requesting.set(true);
    this.partnerPayout
      .request(amount)
      .pipe(finalize(() => this.requesting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Zahtev za isplatu je poslat.', 'U redu', { duration: 3000 });
          this.payoutAmount.set(null);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Zahtev za isplatu nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }
}
