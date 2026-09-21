import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Cart } from '../../services/cart';

/**
 * /korpa/placanje - matches validateCheckout exactly (see order.validator.js).
 * POST /orders/checkout creates a TemporaryOrder; the real order is only confirmed
 * via an emailed link (not part of this frontend flow), so on success this just
 * shows an inline confirmation message rather than navigating to an order-details
 * page - there isn't one to navigate to here.
 */
@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private fb = inject(FormBuilder);
  private cartService = inject(Cart);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', Validators.maxLength(50)],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    note: ['', Validators.maxLength(500)],
    couponCode: ['', Validators.maxLength(50)],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { firstName, lastName, email, phone, city, postalCode, street, number, note, couponCode } = this.form.getRawValue();
    this.cartService
      .checkout({
        firstName: firstName!,
        lastName: lastName || undefined,
        email: email!,
        phone: phone!,
        city: city!,
        postalCode: postalCode!,
        street: street!,
        number: number!,
        note: note || undefined,
        couponCode: couponCode || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Proverite email da potvrdite porudžbinu.');
          this.form.reset();
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error?.message || 'Porudžbina nije uspela. Proverite podatke i pokušajte ponovo.');
        },
      });
  }
}
