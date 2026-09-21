import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscriber } from '../../features/newsletter/services/subscriber';

@Component({
  selector: 'app-footer',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly year = new Date().getFullYear();

  private fb = inject(FormBuilder);
  private subscriber = inject(Subscriber);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  newsletterForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    consent: [false, [Validators.requiredTrue]],
  });

  subscribe(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // consentGiven is required (requiredTrue) by the form, already checked above,
    // so this call is only reachable once it's true - the literal string "true"
    // is what the backend's express-validator .equals("true") check requires
    // (see SubscriberSubmitPayload's own comment).
    const { email } = this.newsletterForm.getRawValue();
    this.subscriber.subscribe({ email: email!, consent: 'true' }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
        this.newsletterForm.reset({ consent: false });
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.message || 'Prijava na newsletter nije uspela. Pokušajte ponovo.');
      },
    });
  }
}
