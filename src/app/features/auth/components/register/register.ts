import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../../core/services/auth';

// Matches validateRegister exactly (see auth.validator.js) - same field set,
// same min-length rules, passwordConfirm checked against password.
@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.password !== this.form.value.passwordConfirm) {
      this.errorMessage.set('Lozinke se ne poklapaju.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { firstName, lastName, email, phone, password, passwordConfirm } = this.form.getRawValue();
    this.authService
      .register({
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        phone: phone || undefined,
        password: password!,
        passwordConfirm: passwordConfirm!,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message);
          // A verification email is required before login (except the very first
          // account ever created - see auth.ts's register() comment), so this
          // deliberately does NOT auto-navigate to login: the person needs to see
          // the message telling them to check their inbox.
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error?.message || 'Registracija nije uspela. Proverite podatke i pokušajte ponovo.');
        },
      });
  }
}
