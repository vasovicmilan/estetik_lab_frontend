import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscriber } from '../../services/subscriber';

/**
 * Reached from the newsletter footer's unsubscribe link
 * (buildLink("newsletterUnsubscribe", ...) in campaign emails ->
 * POST /api/v1/newsletter/unsubscribe/:token). Same "fire on load, no form"
 * pattern as verify-account and order-confirm - the token in the URL is the
 * whole action. Mounted at /newsletter/odjava/:token (see app.routes.ts).
 */
@Component({
  selector: 'app-newsletter-unsubscribe',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './newsletter-unsubscribe.html',
  styleUrl: './newsletter-unsubscribe.scss',
})
export class NewsletterUnsubscribe implements OnInit {
  private subscriber = inject(Subscriber);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.errorMessage.set('Link za odjavu nije ispravan.');
      return;
    }

    this.subscriber.unsubscribe(token).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.message || 'Odjava sa newslettera nije uspela. Link je možda istekao ili je već iskorišćen.');
      },
    });
  }
}
