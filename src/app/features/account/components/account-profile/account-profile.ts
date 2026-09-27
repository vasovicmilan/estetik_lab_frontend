import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Profile as ProfileService } from '../../services/profile';
import { UserProfile } from '../../models/profile';
import { Auth } from '../../../../core/services/auth';

/**
 * "Home" of the account area - profile view + edit, change-password form and
 * deactivate-account section, all on one page (mounted at /moj-nalog). Kept as
 * one page rather than sub-tabs since each section is short; styled like the
 * public login/register forms (simple cards), using Material form controls for
 * consistency with the rest of the app.
 */
@Component({
  selector: 'app-account-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './account-profile.html',
  styleUrl: './account-profile.scss',
})
export class AccountProfile implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  profile = signal<UserProfile | null>(null);
  loading = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);
  savingSetPassword = signal(false);
  deactivating = signal(false);

  profileForm = this.fb.group({
    firstName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.minLength(2), Validators.maxLength(50)]],
    phone: ['', [Validators.maxLength(30)]],
  });

  passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  /** Same shape/validation as passwordForm above, minus oldPassword - only
   * shown while profile().hasPassword is false (see setPassword.html's
   * app-set-password equivalent for the same two-field pattern). */
  setPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  /** Only shown/required when the account has a password to begin with -
   * Google-login accounts don't, so this field is skipped entirely for them. */
  deactivatePassword = signal('');

  ngOnInit(): void {
    this.load();
  }

  /** Local-account accounts show nacinPrijave as something other than a
   * provider name - "Lokalni nalog" is the one value that means "has a
   * password". Anything else (e.g. "Google") means there's no password to ask
   * for on deactivate. */
  get isLocalAccount(): boolean {
    return this.profile()?.nacinPrijave === 'Lokalni nalog';
  }

  private load(): void {
    this.loading.set(true);
    this.profileService
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.patchValue({
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.telefon ?? '',
          });
        },
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje profila nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, phone } = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.profileService
      .update({
        firstName: firstName?.trim() || undefined,
        lastName: lastName?.trim() || undefined,
        phone: phone?.trim() || undefined,
      })
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.snackBar.open('Profil je ažuriran.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena profila nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.snackBar.open('Nova lozinka i potvrda se ne poklapaju.', 'U redu', { duration: 4000 });
      return;
    }

    this.savingPassword.set(true);
    this.profileService
      .changePassword({ oldPassword: oldPassword!, newPassword: newPassword!, confirmPassword: confirmPassword! })
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Lozinka je promenjena.', 'U redu', { duration: 3000 });
          this.passwordForm.reset();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena lozinke nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  /** Only reachable while profile().hasPassword is false - the backend rejects
   * it with 400 once a password exists, pointing the caller at submitPassword
   * instead (same "Nalog već ima podešenu lozinku." message shown there). */
  submitSetPassword(): void {
    if (this.setPasswordForm.invalid) {
      this.setPasswordForm.markAllAsTouched();
      return;
    }
    const { newPassword, confirmPassword } = this.setPasswordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.snackBar.open('Lozinke se ne poklapaju.', 'U redu', { duration: 4000 });
      return;
    }

    this.savingSetPassword.set(true);
    this.profileService
      .setPassword({ newPassword: newPassword!, confirmPassword: confirmPassword! })
      .pipe(finalize(() => this.savingSetPassword.set(false)))
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Lozinka je podešena.', 'U redu', { duration: 3000 });
          this.setPasswordForm.reset();
          // Optimistic flip (same approach as deactivate()'s local session clear
          // below) rather than a refetch - the section now hides itself since
          // it's only rendered while hasPassword is false.
          this.profile.update((p) => (p ? { ...p, hasPassword: true } : p));
        },
        error: (error) => this.snackBar.open(error?.message || 'Podešavanje lozinke nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Deactivate (irreversible from the UI's perspective) ----

  deactivate(): void {
    const warning =
      'Ova radnja deaktivira vaš nalog i ne može se poništiti iz aplikacije. Da li ste sigurni da želite da nastavite?';
    if (!confirm(warning)) return;

    const password = this.isLocalAccount ? this.deactivatePassword().trim() : undefined;

    this.deactivating.set(true);
    this.profileService
      .deactivate(password || undefined)
      .pipe(finalize(() => this.deactivating.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Nalog je deaktiviran.', 'U redu', { duration: 3000 });
          this.auth.clearSession();
          this.router.navigate(['/']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Deaktivacija naloga nije uspela.', 'U redu', { duration: 4000 }),
      });
  }
}
