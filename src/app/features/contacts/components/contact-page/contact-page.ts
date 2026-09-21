import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Contact } from '../../services/contact';

// Matches validateContactCreate exactly (contact.validator.js) - same field
// set, same min/max-length rules. Error handling mirrors auth/register.ts:
// the shared error-interceptor already flattens a 400's { error: { message } }
// body down to a single Error(message), so there is no field-level API error
// shape to surface here beyond the one inline banner (same as Register/Login).
@Component({
  selector: 'app-contact-page',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage {
  private fb = inject(FormBuilder);
  private contact = inject(Contact);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.maxLength(30)]],
    topic: ['', [Validators.maxLength(150)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    consent: [false, [Validators.requiredTrue]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { firstName, lastName, email, phone, topic, message, consent } = this.form.getRawValue();
    this.contact
      .submit({
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        phone: phone || undefined,
        topic: topic || undefined,
        message: message!,
        consent: consent!,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message);
          this.form.reset({ consent: false });
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error?.message || 'Slanje poruke nije uspelo. Pokušajte ponovo.');
        },
      });
  }
}
