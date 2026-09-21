import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { PartnerDashboardService } from '../../services/partner-dashboard';
import { PartnerDashboard as PartnerDashboardModel, PartnerCouponDiscountType } from '../../models/dashboard';
import { PartnerPayoutStatus } from '../../models/payout';

const DISCOUNT_TYPE_LABELS: Record<PartnerCouponDiscountType, string> = {
  percentage: 'Procenat',
  fixed: 'Fiksni iznos',
};

/** Same labels partner-earnings.ts uses for the full payout history table -
 * kept in sync manually since this is just a short "recent" preview here. */
const PAYOUT_STATUS_LABELS: Record<PartnerPayoutStatus, string> = {
  requested: 'Zatraženo',
  approved: 'Odobreno',
  paid: 'Isplaćeno',
  rejected: 'Odbijeno',
};

/** Landing page of the partner portal - own commission rates, balance summary,
 * active coupon code(s) (with restrictions labeled where the coupon isn't
 * store-wide), and a short recent-commissions/recent-payouts list. Mounted at
 * /partner-panel (index route). */
@Component({
  selector: 'app-partner-dashboard',
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './partner-dashboard.html',
  styleUrl: './partner-dashboard.scss',
})
export class PartnerDashboard implements OnInit {
  private partnerDashboard = inject(PartnerDashboardService);
  private snackBar = inject(MatSnackBar);

  dashboard = signal<PartnerDashboardModel | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  discountTypeLabel(type: PartnerCouponDiscountType): string {
    return DISCOUNT_TYPE_LABELS[type] ?? type;
  }

  payoutStatusLabel(status: PartnerPayoutStatus): string {
    return PAYOUT_STATUS_LABELS[status] ?? status;
  }

  /** Empty applicableServices/applicablePackages list = applies to ALL
   * services/packages - only list names for a restricted coupon (non-empty list). */
  restrictedServiceNames(dashboard: PartnerDashboardModel, coupon: { applicableServices: string[] }): string[] {
    return coupon.applicableServices.map((id) => dashboard.serviceNamesById[id]).filter((name): name is string => !!name);
  }

  restrictedPackageNames(dashboard: PartnerDashboardModel, coupon: { applicablePackages: string[] }): string[] {
    return coupon.applicablePackages.map((id) => dashboard.packageNamesById[id]).filter((name): name is string => !!name);
  }

  excludedCategoryNames(dashboard: PartnerDashboardModel, categoryIds: string[]): string[] {
    return categoryIds.map((id) => dashboard.categoryNamesById[id]).filter((name): name is string => !!name);
  }

  /** No date-pipe/locale-data convention exists elsewhere in this app to
   * mirror (same as employee-portal), so this just formats with the browser's
   * own sr-RS locale support. */
  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
  }

  private load(): void {
    this.loading.set(true);
    this.partnerDashboard
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje pregleda nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
