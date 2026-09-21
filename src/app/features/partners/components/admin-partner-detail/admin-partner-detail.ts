import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Partner } from '../../services/partner';
import { PartnerAdminDetail } from '../../models/partner';

/** Read-only view of GET /admin/partners/:id (Partner.getById() -> PartnerAdminDetail).
 * Mounted at /admin/partneri/:id/pregled (see partners.routes.ts). Delete surfaces
 * the backend's block-reason message (pending commission/unresolved payout) as-is,
 * same pattern as admin-user-detail's remove(). */
@Component({
  selector: 'app-admin-partner-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-partner-detail.html',
  styleUrl: './admin-partner-detail.scss',
})
export class AdminPartnerDetail implements OnInit {
  private partner = inject(Partner);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  partnerId = signal<string | null>(null);
  detail = signal<PartnerAdminDetail | null>(null);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.partnerId.set(id);
    this.loading.set(true);
    this.partner
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju partnera.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.partnerId();
    const detail = this.detail();
    if (!id || !detail) return;
    if (!confirm(`Obrisati partnera "${detail.korisnik.imePrezime}"?`)) return;

    this.deleting.set(true);
    this.partner
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Partner je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/partneri']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 5000 }),
      });
  }
}
