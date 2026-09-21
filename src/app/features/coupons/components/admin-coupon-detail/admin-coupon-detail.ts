import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Coupon } from '../../services/coupon';
import { CouponAdminDetail as CouponAdminDetailModel } from '../../models/coupon';

/** Read-only view of GET /admin/coupons/:id (Coupon.getById() -> CouponAdminDetail).
 * Mounted at /admin/kuponi/:id/pregled (see coupons.routes.ts). Same
 * load/delete-with-confirm pattern as admin-category-detail/admin-category-list. */
@Component({
  selector: 'app-admin-coupon-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-coupon-detail.html',
  styleUrl: './admin-coupon-detail.scss',
})
export class AdminCouponDetail implements OnInit {
  private coupon = inject(Coupon);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  couponId = signal<string | null>(null);
  detail = signal<CouponAdminDetailModel | null>(null);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.couponId.set(id);
    this.loading.set(true);
    this.coupon
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju kupona.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.couponId();
    const kod = this.detail()?.osnovno.kod;
    if (!id) return;
    if (!confirm(`Obrisati kupon "${kod}"?`)) return;

    this.deleting.set(true);
    this.coupon
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Kupon je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/kuponi']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
