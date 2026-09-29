import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscriber } from '../../features/newsletter/services/subscriber';
import { Api } from '../../core/services/api';
import { BusinessInfo, BusinessInfoResponse, toBusinessInfo } from '../../core/models/business-info';

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
    MatIconModule,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnInit {
  protected readonly year = new Date().getFullYear();

  // Populated from GET /api/v1/business-info in ngOnInit below. Stays null
  // on any error - a missing footer contact block shouldn't surface a
  // user-facing error, so failures are logged and swallowed. The template
  // renders each field independently once this signal is populated.
  protected readonly businessInfo = signal<BusinessInfo | null>(null);

  private fb = inject(FormBuilder);
  private subscriber = inject(Subscriber);
  private api = inject(Api);

  ngOnInit(): void {
    this.api.get<BusinessInfoResponse>('business-info').subscribe({
      next: (response) => this.businessInfo.set(toBusinessInfo(response)),
      error: (error) => {
        console.warn('Failed to load business info for footer:', error);
      },
    });
  }

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
