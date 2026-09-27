import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../../core/services/auth';

export type SetPasswordVariant = 'reset' | 'claim';

/**
 * Shared by two routes that hit the exact same backend endpoint
 * (PUT /api/v1/auth/reset-password/:token - see ResetPasswordPayload's comment
 * in core/models/auth.ts for why there is no separate "claim" endpoint):
 *  - /resetovanje-lozinke/:token  (data: { variant: 'reset' })  - "forgot password"
 *  - /preuzmi-nalog/:token       (data: { variant: 'claim' })  - an employee/partner
 *    account created by an admin, claimed via the emailed link
 * Only the heading/copy differs, driven by route `data.variant` (see
 * app.routes.ts) - not two near-identical components to keep in sync.
 */
@Component({
  selector: 'app-set-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
})
export class SetPassword {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private route = inject(ActivatedRoute);

  variant = signal<SetPasswordVariant>((this.route.snapshot.data['variant'] as SetPasswordVariant) ?? 'reset');
  isClaim = computed(() => this.variant() === 'claim');

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Lozinke se ne poklapaju.');
      return;
    }

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.errorMessage.set('Link nije ispravan.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.resetPassword(token, { newPassword: newPassword!, confirmPassword: confirmPassword! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.message || (this.isClaim() ? 'Preuzimanje naloga nije uspelo.' : 'Resetovanje lozinke nije uspelo.')
        );
      },
    });
  }
}
