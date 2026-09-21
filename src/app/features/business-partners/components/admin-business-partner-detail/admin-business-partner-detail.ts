import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { BusinessPartner } from '../../services/business-partner';
import { BusinessPartnerAdminDetail } from '../../models/business-partner';

/** Read-only view of GET /admin/business-partners/:id
 * (BusinessPartner.getById() -> BusinessPartnerAdminDetail). Mounted at
 * /admin/poslovni-saradnici/:id/pregled (see business-partners.routes.ts).
 * Renders `sadrzaj` with the shared <app-content-blocks> component, same as
 * admin-blog-detail. */
@Component({
  selector: 'app-admin-business-partner-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './admin-business-partner-detail.html',
  styleUrl: './admin-business-partner-detail.scss',
})
export class AdminBusinessPartnerDetail implements OnInit {
  private businessPartner = inject(BusinessPartner);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  partnerId = signal<string | null>(null);
  detail = signal<BusinessPartnerAdminDetail | null>(null);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.partnerId.set(id);
    this.loading.set(true);
    this.businessPartner
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju saradnika.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.partnerId();
    const detail = this.detail();
    if (!id || !detail) return;
    if (!confirm(`Obrisati saradnika "${detail.naziv}"?`)) return;

    this.deleting.set(true);
    this.businessPartner
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Poslovni saradnik je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/poslovni-saradnici']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
