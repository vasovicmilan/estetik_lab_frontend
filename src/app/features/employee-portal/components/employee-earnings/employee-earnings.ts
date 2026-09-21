import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import { EmployeeDashboard } from '../../services/employee-dashboard';
import { EmployeeCommission } from '../../services/employee-commission';
import { EmployeePayout } from '../../services/employee-payout';
import { EmployeeBalance } from '../../models/dashboard';
import { CommissionEntry, CommissionSourceType, CommissionStatus } from '../../models/commission';
import { PayoutRequest, PayoutStatus } from '../../models/payout';

const SOURCE_TYPE_LABELS: Record<CommissionSourceType, string> = {
  appointment: 'Termin',
  order: 'Porudžbina',
  package_purchase: 'Paket',
};

const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: 'Na čekanju',
  earned: 'Zarađeno',
  reversed: 'Stornirano',
};

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  requested: 'Zatraženo',
  approved: 'Odobreno',
  paid: 'Isplaćeno',
  rejected: 'Odbijeno',
};

/**
 * "Provizije i isplate" - balance summary (reused from the dashboard's shape,
 * refetched here since this page is reachable independently), a commissions
 * history table, a payout-requests history table, and an inline "Zatraži
 * isplatu" form. Only reachable when isCommissionBased (see EmployeeShell's nav
 * gating) - the route itself has no separate guard for that, same as the rest
 * of this feature it just relies on the backend endpoints being meaningless
 * for a non-commission employee (empty lists, 400 on payout request).
 *
 * commissions/payouts are RAW/unformatted backend data (see commission.ts's and
 * payout.ts's header comments) - all translation/formatting (status labels,
 * source-type labels, " RSD" suffix, date) happens here, client-side.
 * Mounted at /zaposleni-panel/zarade.
 */
@Component({
  selector: 'app-employee-earnings',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './employee-earnings.html',
  styleUrl: './employee-earnings.scss',
})
export class EmployeeEarnings implements OnInit {
  private employeeDashboard = inject(EmployeeDashboard);
  private employeeCommission = inject(EmployeeCommission);
  private employeePayout = inject(EmployeePayout);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  requesting = signal(false);

  balance = signal<EmployeeBalance | null>(null);
  commissions = signal<CommissionEntry[]>([]);
  payouts = signal<PayoutRequest[]>([]);

  payoutAmount = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      dashboard: this.employeeDashboard.get(),
      commissions: this.employeeCommission.list({ limit: 50 }),
      payouts: this.employeePayout.list({ limit: 50 }),
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

  sourceTypeLabel(type: CommissionSourceType): string {
    return SOURCE_TYPE_LABELS[type] ?? type;
  }

  commissionStatusLabel(status: CommissionStatus): string {
    return COMMISSION_STATUS_LABELS[status] ?? status;
  }

  payoutStatusLabel(status: PayoutStatus): string {
    return PAYOUT_STATUS_LABELS[status] ?? status;
  }

  /** No date-pipe/locale-data convention exists elsewhere in this app to
   * mirror (checked account/appointments/employees features), so this just
   * formats with the browser's own sr-RS locale support, as the task spec
   * suggests as the fallback. */
  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
  }

  requestPayout(): void {
    const amount = this.payoutAmount();
    if (!amount || amount <= 0) return;

    this.requesting.set(true);
    this.employeePayout
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
