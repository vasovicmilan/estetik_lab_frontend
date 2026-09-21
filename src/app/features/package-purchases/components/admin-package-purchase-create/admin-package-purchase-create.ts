import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, finalize } from 'rxjs';
import { PackagePurchase } from '../../services/package-purchase';
import { PackagePurchaseCouponPreview, PackagePurchaseCreatePayload } from '../../models/package-purchase';
import { Package } from '../../../packages-catalog/services/package';
import { PackageListItem } from '../../../packages-catalog/models/package';
import { User } from '../../../users/services/user';
import { UserAdminListItem } from '../../../users/models/user';

/**
 * "Novi kupljeni paket" - manually creates/assigns a package purchase for a
 * user (POST /admin/package-purchases). This feature has no bare `:id` edit
 * route (see package-purchases.routes.ts), so this is the only write form.
 *
 * User picker: a MatAutocomplete searching User.listAdmin({search}) as the
 * admin types (debounced) - this repo has no existing autocomplete precedent
 * to follow, so this introduces the module fresh; `MatAutocompleteModule` is
 * already part of the installed @angular/material package. The control holds
 * free-text label while `selectedUserId` is the actual value sent - cleared if
 * the admin edits the text after picking someone, so a half-typed search can't
 * silently submit a stale userId.
 *
 * Package picker: a plain `mat-select` populated from Package.listAdmin({limit:
 * 200}) in one shot, same "just load them all, no search" choice
 * admin-coupon-form.ts already makes for its own packageOptions - there are
 * few enough packages in the catalog that this is simpler than another
 * autocomplete.
 *
 * Coupon preview: "Proveri kupon" calls checkCoupon() (a preview only, per the
 * backend contract - the actual redemption happens server-side inside
 * create() when couponCode is included) and renders the discount breakdown
 * inline; it requires a package to already be selected.
 */
@Component({
  selector: 'app-admin-package-purchase-create',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-package-purchase-create.html',
  styleUrl: './admin-package-purchase-create.scss',
})
export class AdminPackagePurchaseCreate implements OnInit {
  private fb = inject(FormBuilder);
  private packagePurchase = inject(PackagePurchase);
  private package_ = inject(Package);
  private user = inject(User);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  packageOptions = signal<PackageListItem[]>([]);
  loadingPackages = signal(false);

  userOptions = signal<UserAdminListItem[]>([]);
  searchingUsers = signal(false);
  selectedUserId = signal<string | null>(null);

  checkingCoupon = signal(false);
  couponPreview = signal<PackagePurchaseCouponPreview | null>(null);
  couponError = signal<string | null>(null);

  saving = signal(false);

  form = this.fb.group({
    userSearch: ['', Validators.required],
    packageId: ['', Validators.required],
    expiresAt: [''],
    pricePaid: [null as number | null],
    couponCode: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadingPackages.set(true);
    this.package_.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => {
        this.packageOptions.set(data);
        this.loadingPackages.set(false);
      },
      error: () => this.loadingPackages.set(false),
    });

    this.form.controls.userSearch.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      // Any manual edit after a pick invalidates the previously selected id.
      this.selectedUserId.set(null);

      const search = (value ?? '').trim();
      if (search.length < 2) {
        this.userOptions.set([]);
        return;
      }

      this.searchingUsers.set(true);
      this.user.listAdmin({ search, limit: 10 }).subscribe({
        next: ({ data }) => {
          this.userOptions.set(data);
          this.searchingUsers.set(false);
        },
        error: () => this.searchingUsers.set(false),
      });
    });

    this.form.controls.packageId.valueChanges.subscribe(() => {
      this.couponPreview.set(null);
      this.couponError.set(null);
    });
  }

  onUserSelected(user: UserAdminListItem): void {
    this.selectedUserId.set(user.id);
    this.form.controls.userSearch.setValue(`${user.imePrezime} (${user.email})`, { emitEvent: false });
    this.userOptions.set([]);
  }

  checkCoupon(): void {
    const packageId = this.form.value.packageId;
    const code = (this.form.value.couponCode || '').trim();
    if (!packageId || !code) return;

    this.checkingCoupon.set(true);
    this.couponPreview.set(null);
    this.couponError.set(null);
    this.packagePurchase
      .checkCoupon({ code, packageId, userId: this.selectedUserId() ?? undefined })
      .pipe(finalize(() => this.checkingCoupon.set(false)))
      .subscribe({
        next: (preview) => this.couponPreview.set(preview),
        error: (error) => this.couponError.set(error?.message || 'Kupon nije validan za izabrani paket.'),
      });
  }

  submit(): void {
    if (this.form.invalid || !this.selectedUserId()) {
      this.form.markAllAsTouched();
      if (!this.selectedUserId()) {
        this.snackBar.open('Izaberite korisnika iz liste predloga.', 'U redu', { duration: 4000 });
      }
      return;
    }

    const raw = this.form.value;
    const payload: PackagePurchaseCreatePayload = {
      userId: this.selectedUserId()!,
      packageId: raw.packageId!,
      expiresAt: raw.expiresAt || undefined,
      pricePaid: raw.pricePaid ?? undefined,
      couponCode: raw.couponCode?.trim() || undefined,
      notes: raw.notes?.trim() || undefined,
    };

    this.saving.set(true);
    this.packagePurchase
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (detail) => {
          this.snackBar.open('Kupljeni paket je kreiran.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/kupljeni-paketi', detail.id, 'pregled']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Kreiranje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
