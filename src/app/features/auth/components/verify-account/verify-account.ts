import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../../core/services/auth';

/**
 * Reached from the account-verification email (buildLink("verifyAccount", ...) in
 * email.service.js -> GET /api/v1/auth/verify/:token). No form, no user action -
 * the token in the URL IS the action, so this fires the request once on load and
 * shows the outcome. One-shot: a second visit to the same link errors out
 * server-side (token already consumed), which lands in the error branch below,
 * not a special "already verified" state - the backend doesn't distinguish them.
 * Mounted at /verifikacija/:token (see app.routes.ts).
 */
@Component({
  selector: 'app-verify-account',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './verify-account.html',
  styleUrl: './verify-account.scss',
})
export class VerifyAccount implements OnInit {
  private authService = inject(Auth);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  email = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.errorMessage.set('Link za verifikaciju nije ispravan.');
      return;
    }

    this.authService.verifyAccount(token).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.email.set(res.email);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.message || 'Verifikacija naloga nije uspela. Link je možda istekao ili je već iskorišćen.');
      },
    });
  }
}
