import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../../core/services/auth';
import { Testimonial } from '../../services/testimonial';

/**
 * Public "Ostavi utisak" form - any visitor may submit, not gated behind
 * login (email is optional, prefilled from the logged-in user when
 * available). No public testimonials LIST/display page exists anywhere in
 * this app yet (see home.ts's own comment), so this is a standalone route
 * (/utisci/ostavi) reachable from the footer, not attached to a display
 * section - out of scope here, only the submission form.
 *
 * service/package/product are left OUT of this v1 form on purpose - all
 * three are optional server-side (mongoId references), and wiring up real
 * pickers for them is unnecessary complexity for a first pass; only
 * name/email/rating/message/consent are collected.
 */
@Component({
  selector: 'app-testimonial-submit',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './testimonial-submit.html',
  styleUrl: './testimonial-submit.scss',
})
export class TestimonialSubmit {
  private fb = inject(FormBuilder);
  private testimonial = inject(Testimonial);
  private auth = inject(Auth);

  readonly ratings = [1, 2, 3, 4, 5];

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [this.auth.currentUser()?.email ?? '', [Validators.email]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    consentGiven: [false, [Validators.requiredTrue]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { name, email, rating, message, consentGiven } = this.form.getRawValue();
    this.testimonial
      .submit({
        name: name!,
        email: email || undefined,
        rating: rating!,
        message: message!,
        consentGiven: consentGiven!,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error?.message || 'Slanje utiska nije uspelo. Pokušajte ponovo.');
        },
      });
  }
}
