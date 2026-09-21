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
import { PackagePurchase } from '../../services/package-purchase';
import { PackagePurchaseAdminDetail as PackagePurchaseAdminDetailModel } from '../../models/package-purchase';

/** Read + inline-edit view of GET /admin/package-purchases/:id. Mounted at
 * /admin/kupljeni-paketi/:id/pregled (see package-purchases.routes.ts). Same
 * load/delete-with-confirm pattern as admin-coupon-detail, plus an inline
 * napomena/expiresAtRaw editor (PUT .../:id) and a cancel action (PUT
 * .../:id/cancel) - per the backend contract these two fields are the ONLY
 * ones editable after creation, so there is no separate admin-package-
 * purchase-form. */
@Component({
  selector: 'app-admin-package-purchase-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './admin-package-purchase-detail.html',
  styleUrl: './admin-package-purchase-detail.scss',
})
export class AdminPackagePurchaseDetail implements OnInit {
  private packagePurchase = inject(PackagePurchase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  purchaseId = signal<string | null>(null);
  detail = signal<PackagePurchaseAdminDetailModel | null>(null);
  loading = signal(false);
  saving = signal(false);
  acting = signal(false);

  notesEdit = signal('');
  expiresAtEdit = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.purchaseId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.purchaseId();
    if (!id) return;

    this.loading.set(true);
    this.packagePurchase
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.notesEdit.set(detail.napomena ?? '');
          this.expiresAtEdit.set(detail.expiresAtRaw ?? '');
        },
        error: () => this.snackBar.open('Greška pri učitavanju kupljenog paketa.', 'U redu', { duration: 4000 }),
      });
  }

  saveEdits(): void {
    const id = this.purchaseId();
    if (!id) return;

    this.saving.set(true);
    this.packagePurchase
      .update(id, { notes: this.notesEdit(), expiresAt: this.expiresAtEdit() || undefined })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Izmene su sačuvane.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  cancelPurchase(): void {
    const id = this.purchaseId();
    if (!id) return;
    if (!confirm('Otkazati ovaj kupljeni paket?')) return;

    this.acting.set(true);
    this.packagePurchase
      .cancel(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Kupljeni paket je otkazan.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Otkazivanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.purchaseId();
    if (!id) return;
    if (!confirm('Obrisati ovaj kupljeni paket? Ova radnja je trajna.')) return;

    this.acting.set(true);
    this.packagePurchase
      .delete(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Kupljeni paket je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/kupljeni-paketi']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
