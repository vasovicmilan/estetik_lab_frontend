import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { Partner } from '../../services/partner';
import { PartnerCreatePayload, PartnerEditPayload, PartnerUpdatePayload } from '../../models/partner';
import { User } from '../../../users/services/user';
import { UserAdminListItem } from '../../../users/models/user';

/**
 * Create + edit, same pattern as admin-employee-form: loads the RAW edit shape
 * (GET /admin/partners/:id/edit) when an id is present in the route, otherwise
 * starts blank for a new partner.
 *
 * `userId` is chosen from a flat `mat-select` populated by
 * User.listAdmin({limit: 200}) (same known v1 limitation as admin-employee-form's
 * user picker - fine for a small pool, no real autocomplete). It is shown +
 * REQUIRED only when creating; once a partner exists the control is dropped from
 * the form entirely rather than disabled, since userId can't change on an
 * existing partner and isn't accepted by the update endpoint at all (see
 * partner.ts's update() signature).
 */
@Component({
  selector: 'app-admin-partner-form',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-partner-form.html',
  styleUrl: './admin-partner-form.scss',
})
export class AdminPartnerForm implements OnInit {
  private fb = inject(FormBuilder);
  private partner = inject(Partner);
  private user = inject(User);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  partnerId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  optionsLoading = signal(false);

  userOptions = signal<UserAdminListItem[]>([]);

  form: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    commissionRateServices: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    commissionRateProducts: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    maxCommissionAmountServices: [null as number | null, Validators.min(0)],
    maxCommissionAmountProducts: [null as number | null, Validators.min(0)],
    isActive: [true],
    notes: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loadUserOptions();
      return;
    }

    this.partnerId.set(id);
    // userId isn't editable once a partner exists - drop the control entirely
    // (not just disable it) so it's never part of the submit payload.
    this.form.removeControl('userId');

    this.loading.set(true);
    this.partner
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.patchForm(payload),
        error: () => this.snackBar.open('Greška pri učitavanju partnera.', 'U redu', { duration: 4000 }),
      });
  }

  private loadUserOptions(): void {
    this.optionsLoading.set(true);
    this.user
      .listAdmin({ limit: 200 })
      .pipe(finalize(() => this.optionsLoading.set(false)))
      .subscribe({
        next: ({ data }) => this.userOptions.set(data),
        error: () => this.snackBar.open('Greška pri učitavanju korisnika.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(payload: PartnerEditPayload): void {
    this.form.patchValue({
      commissionRateServices: payload.commissionRateServices ?? 0,
      commissionRateProducts: payload.commissionRateProducts ?? 0,
      maxCommissionAmountServices: payload.maxCommissionAmountServices ?? null,
      maxCommissionAmountProducts: payload.maxCommissionAmountProducts ?? null,
      isActive: payload.isActive ?? true,
      notes: payload.notes ?? '',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const id = this.partnerId();

    this.saving.set(true);
    let request$: Observable<unknown>;
    if (id) {
      const payload: PartnerUpdatePayload = {
        commissionRateServices: raw.commissionRateServices,
        commissionRateProducts: raw.commissionRateProducts,
        maxCommissionAmountServices: raw.maxCommissionAmountServices,
        maxCommissionAmountProducts: raw.maxCommissionAmountProducts,
        isActive: raw.isActive,
        notes: raw.notes,
      };
      request$ = this.partner.update(id, payload);
    } else {
      const payload: PartnerCreatePayload = {
        userId: raw.userId,
        commissionRateServices: raw.commissionRateServices,
        commissionRateProducts: raw.commissionRateProducts,
        maxCommissionAmountServices: raw.maxCommissionAmountServices,
        maxCommissionAmountProducts: raw.maxCommissionAmountProducts,
        isActive: raw.isActive,
        notes: raw.notes,
      };
      request$ = this.partner.create(payload);
    }

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Partner je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/partneri']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
