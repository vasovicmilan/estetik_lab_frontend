import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminProfile as AdminProfileService } from '../../services/admin-profile';
import { AdminOwnProfile } from '../../models/admin-profile';

/** The logged-in admin's own profile - view + edit (name/phone only, mirrors
 * validateProfileUpdate's field set exactly, see models/admin-profile.ts's
 * header comment). No password-change/deactivate sections here (those stay
 * user-only concerns in "Moj nalog" - admins use their own login regardless,
 * see the task spec). A small new component, admin-shell-styled, NOT a reuse
 * of account-profile (different route base, different shell). Mounted at
 * /admin/profil. */
@Component({
  selector: 'app-admin-profile',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.scss',
})
export class AdminProfile implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(AdminProfileService);
  private snackBar = inject(MatSnackBar);

  profile = signal<AdminOwnProfile | null>(null);
  loading = signal(false);
  saving = signal(false);

  form = this.fb.group({
    firstName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    phone: ['', [Validators.maxLength(30)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.profileService
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.form.patchValue({
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.telefon ?? '',
          });
        },
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje profila nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, phone } = this.form.getRawValue();
    this.saving.set(true);
    this.profileService
      .update({
        firstName: firstName?.trim() || undefined,
        lastName: lastName?.trim() || undefined,
        phone: phone?.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.snackBar.open('Profil je ažuriran.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena profila nije uspela.', 'U redu', { duration: 4000 }),
      });
  }
}
