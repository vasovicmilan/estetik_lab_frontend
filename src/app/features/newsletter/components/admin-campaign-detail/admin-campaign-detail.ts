import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { Campaign } from '../../services/campaign';
import { CampaignAdminDetail as CampaignAdminDetailModel } from '../../models/campaign';

/** Read-only view of GET /admin/newsletter-campaigns/:id (Campaign.getById() ->
 * CampaignAdminDetail). Mounted at /admin/kampanje/:id/pregled (see
 * campaigns.routes.ts). Renders `sadrzaj` with the shared <app-content-blocks>
 * component, same as admin-business-partner-detail. "Pošalji sada" sends the
 * campaign immediately, bypassing any schedule - irreversible, so it's gated
 * behind confirm() same as remove(); both the send and edit actions are hidden
 * once the campaign is already `sent` (a sent campaign is done). */
@Component({
  selector: 'app-admin-campaign-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ContentBlocks],
  templateUrl: './admin-campaign-detail.html',
  styleUrl: './admin-campaign-detail.scss',
})
export class AdminCampaignDetail implements OnInit {
  private campaign = inject(Campaign);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  campaignId = signal<string | null>(null);
  detail = signal<CampaignAdminDetailModel | null>(null);
  loading = signal(false);
  sending = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.campaignId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.campaignId();
    if (!id) return;

    this.loading.set(true);
    this.campaign
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju kampanje.', 'U redu', { duration: 4000 }),
      });
  }

  sendNow(): void {
    const id = this.campaignId();
    const naslov = this.detail()?.naslov;
    if (!id) return;
    if (!confirm(`Poslati kampanju "${naslov}" odmah svim pretplatnicima iz segmenta? Ova radnja se ne može poništiti.`)) return;

    this.sending.set(true);
    this.campaign
      .sendNow(id)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Kampanja je poslata.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Slanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.campaignId();
    const naslov = this.detail()?.naslov;
    if (!id) return;
    if (!confirm(`Obrisati kampanju "${naslov}"?`)) return;

    this.deleting.set(true);
    this.campaign
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Kampanja je obrisana.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/kampanje']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
