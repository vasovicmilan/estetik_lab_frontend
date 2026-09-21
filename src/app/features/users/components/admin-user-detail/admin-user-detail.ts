import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { User } from '../../services/user';
import { RoleOption, UserAdminDetail as UserAdminDetailModel, UserStatus } from '../../models/user';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';

/** Rich read+act view of GET /admin/users/:userId - profile, status change,
 * role change, verify-email, inline simple profile edit, and the two
 * destructive actions (anonymize/delete), each behind a real confirm()
 * dialog. Mounted at /admin/korisnici/:id. Same "no dialog library, inline
 * expanding sections + confirm()" pattern as admin-order-detail.ts and
 * admin-resource-list.ts's remove(). */
@Component({
  selector: 'app-admin-user-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-user-detail.html',
  styleUrl: './admin-user-detail.scss',
})
export class AdminUserDetail implements OnInit {
  private user = inject(User);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  userId = signal<string | null>(null);
  detail = signal<UserAdminDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  roleOptions = signal<RoleOption[]>([]);

  statusOptions: { value: UserStatus; label: string }[] = [
    { value: 'guest', label: 'Gost' },
    { value: 'pending', label: 'Na čekanju' },
    { value: 'active', label: 'Aktivan' },
    { value: 'inactive', label: 'Neaktivan' },
    { value: 'suspended', label: 'Suspendovan' },
  ];

  selectedStatus = signal<UserStatus | null>(null);
  selectedRoleId = signal<string | null>(null);

  /** Inline "Izmeni profil" form - closed by default, opened on demand. */
  editingProfile = signal(false);
  editFirstName = signal('');
  editLastName = signal('');
  editPhone = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.userId.set(id);
    this.load();

    this.user.listRolesForPicker().subscribe((roles) => this.roleOptions.set(roles));
  }

  private load(): void {
    const id = this.userId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.user
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.selectedStatus.set(detail.statusRaw);
          this.selectedRoleId.set(detail.roleId);
          this.editFirstName.set(detail.firstName ?? '');
          this.editLastName.set(detail.lastName ?? '');
          this.editPhone.set(detail.telefon ?? '');
        },
        error: () => this.notFound.set(true),
      });
  }

  // ---- Status ----

  submitStatus(): void {
    const id = this.userId();
    const status = this.selectedStatus();
    if (!id || !status) return;

    this.acting.set(true);
    this.user
      .updateStatus(id, status)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Status korisnika je promenjen.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena statusa nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Role ----

  submitRole(): void {
    const id = this.userId();
    const roleId = this.selectedRoleId();
    if (!id || !roleId) return;

    this.acting.set(true);
    this.user
      .updateRole(id, roleId)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Rola korisnika je promenjena.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena role nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Verify ----

  verify(): void {
    const id = this.userId();
    if (!id) return;

    this.acting.set(true);
    this.user
      .verify(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Nalog je verifikovan.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Verifikacija nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Profile edit ----

  toggleEditProfile(): void {
    this.editingProfile.set(!this.editingProfile());
  }

  submitProfile(): void {
    const id = this.userId();
    if (!id) return;

    this.acting.set(true);
    this.user
      .updateProfile(id, {
        firstName: this.editFirstName().trim() || undefined,
        lastName: this.editLastName().trim() || undefined,
        phone: this.editPhone().trim() || undefined,
      })
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Profil je ažuriran.', 'U redu', { duration: 3000 });
          this.editingProfile.set(false);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena profila nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Destructive actions ----

  anonymize(): void {
    const id = this.userId();
    if (!id) return;
    if (!confirm('Ova radnja je nepovratna. Da biste anonimizovali ovaj nalog, otkucajte "anonimizuj" u sledećem prozoru.')) return;
    const typed = prompt('Otkucajte "anonimizuj" da potvrdite:');
    if (typed?.trim().toLowerCase() !== 'anonimizuj') return;

    this.acting.set(true);
    this.user
      .anonymize(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Nalog je anonimizovan.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Anonimizacija nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.userId();
    if (!id) return;
    if (!confirm('Ova radnja je nepovratna i trajno briše nalog. Da li ste sigurni?')) return;

    this.acting.set(true);
    this.user
      .delete(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Korisnik je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/korisnici']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo (korisnik možda ima porudžbine/zakazivanja).', 'U redu', { duration: 5000 }),
      });
  }
}
