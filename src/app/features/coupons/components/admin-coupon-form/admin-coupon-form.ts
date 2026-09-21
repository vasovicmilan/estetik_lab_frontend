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
import { Coupon } from '../../services/coupon';
import { CouponDiscountType, CouponEditPayload, CouponWritePayload } from '../../models/coupon';
import { Service } from '../../../services-catalog/services/service';
import { ServiceListItem } from '../../../services-catalog/models/service';
import { Package } from '../../../packages-catalog/services/package';
import { PackageListItem } from '../../../packages-catalog/models/package';
import { Product } from '../../../shop/services/product';
import { ProductAdminListItem } from '../../../shop/models/product';
import { Category } from '../../../taxonomy/services/category';
import { CategoryAdminListItem } from '../../../taxonomy/models/category';
import { Partner } from '../../../partners/services/partner';
import { PartnerAdminListItem } from '../../../partners/models/partner';

/**
 * Create + edit, same pattern as admin-category-form/admin-business-partner-form:
 * loads the RAW edit shape (GET /admin/coupons/:id/edit) when an id is present in
 * the route, otherwise starts blank for a new coupon.
 *
 * `code` is shown as a normal required text field on both create and edit - the
 * backend's update validator simply doesn't validate it, so sending it unchanged
 * on update is harmless (same reasoning noted in the task spec: no dedicated
 * "locked on edit" UI in this pass).
 *
 * `applicableServices`/`applicablePackages`/`applicableProducts`/
 * `excludedCategories`/`partner` are `mat-select` pickers sourced from each
 * feature's own `listAdmin({limit:200})` (`excludedCategories` additionally
 * filtered to `domain: 'product'`) - identical pattern to admin-product-form's
 * `categories`/`tags` pickers.
 *
 * The product-discount block (`productDiscountType`/Value/MaxAmount/
 * MinOrderValue/`applicableProducts`/`excludedCategories`) is revealed by the
 * `productDiscountEnabled` checkbox, per the task's field spec.
 */
@Component({
  selector: 'app-admin-coupon-form',
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
  templateUrl: './admin-coupon-form.html',
  styleUrl: './admin-coupon-form.scss',
})
export class AdminCouponForm implements OnInit {
  private fb = inject(FormBuilder);
  private coupon = inject(Coupon);
  private service = inject(Service);
  private package_ = inject(Package);
  private product = inject(Product);
  private category = inject(Category);
  private partner = inject(Partner);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  couponId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  serviceOptions = signal<ServiceListItem[]>([]);
  packageOptions = signal<PackageListItem[]>([]);
  productOptions = signal<ProductAdminListItem[]>([]);
  categoryOptions = signal<CategoryAdminListItem[]>([]);
  partnerOptions = signal<PartnerAdminListItem[]>([]);

  discountTypeOptions: { value: CouponDiscountType; label: string }[] = [
    { value: 'percentage', label: 'Procenat' },
    { value: 'fixed', label: 'Fiksni iznos' },
  ];

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    discountType: ['percentage' as CouponDiscountType, Validators.required],
    discountValue: [0, [Validators.required, Validators.min(0)]],
    maxDiscountAmount: [null as number | null, Validators.min(0)],
    minValue: [0, Validators.min(0)],
    maxUses: [null as number | null, [Validators.min(0)]],
    maxUsesPerUser: [null as number | null, [Validators.min(0)]],
    applicableServices: [[] as string[]],
    applicablePackages: [[] as string[]],
    productDiscountEnabled: [false],
    productDiscountType: ['percentage' as CouponDiscountType],
    productDiscountValue: [0, Validators.min(0)],
    productDiscountMaxAmount: [null as number | null, Validators.min(0)],
    productMinOrderValue: [0, Validators.min(0)],
    applicableProducts: [[] as string[]],
    excludedCategories: [[] as string[]],
    partner: [null as string | null],
    validFrom: ['' as string],
    validUntil: ['' as string],
    isActive: [true],
  });

  ngOnInit(): void {
    this.service.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => this.serviceOptions.set(data),
      error: () => this.serviceOptions.set([]),
    });
    this.package_.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => this.packageOptions.set(data),
      error: () => this.packageOptions.set([]),
    });
    this.product.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => this.productOptions.set(data),
      error: () => this.productOptions.set([]),
    });
    this.category.listAdmin({ domain: 'product', limit: 200 }).subscribe({
      next: ({ data }) => this.categoryOptions.set(data),
      error: () => this.categoryOptions.set([]),
    });
    this.partner.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => this.partnerOptions.set(data),
      error: () => this.partnerOptions.set([]),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.couponId.set(id);
    this.loading.set(true);
    this.coupon
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.patchForm(payload),
        error: () => this.snackBar.open('Greška pri učitavanju kupona.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(payload: CouponEditPayload): void {
    this.form.patchValue({
      code: payload.code,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxDiscountAmount: payload.maxDiscountAmount,
      minValue: payload.minValue,
      maxUses: payload.maxUses,
      maxUsesPerUser: payload.maxUsesPerUser,
      applicableServices: payload.applicableServices ?? [],
      applicablePackages: payload.applicablePackages ?? [],
      productDiscountEnabled: payload.productDiscountEnabled,
      productDiscountType: payload.productDiscountType,
      productDiscountValue: payload.productDiscountValue,
      productDiscountMaxAmount: payload.productDiscountMaxAmount,
      productMinOrderValue: payload.productMinOrderValue,
      applicableProducts: payload.applicableProducts ?? [],
      excludedCategories: payload.excludedCategories ?? [],
      partner: payload.partner,
      validFrom: payload.validFrom ? payload.validFrom.slice(0, 10) : '',
      validUntil: payload.validUntil ? payload.validUntil.slice(0, 10) : '',
      isActive: payload.isActive,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: CouponWritePayload = {
      code: raw.code,
      discountType: raw.discountType,
      discountValue: raw.discountValue,
      maxDiscountAmount: raw.maxDiscountAmount === '' ? null : raw.maxDiscountAmount,
      minValue: raw.minValue ?? 0,
      maxUses: raw.maxUses === '' || raw.maxUses == null ? null : raw.maxUses,
      maxUsesPerUser: raw.maxUsesPerUser === '' || raw.maxUsesPerUser == null ? null : raw.maxUsesPerUser,
      applicableServices: raw.applicableServices ?? [],
      applicablePackages: raw.applicablePackages ?? [],
      productDiscountEnabled: raw.productDiscountEnabled,
      productDiscountType: raw.productDiscountType,
      productDiscountValue: raw.productDiscountValue ?? 0,
      productDiscountMaxAmount: raw.productDiscountMaxAmount === '' ? null : raw.productDiscountMaxAmount,
      productMinOrderValue: raw.productMinOrderValue ?? 0,
      applicableProducts: raw.applicableProducts ?? [],
      excludedCategories: raw.excludedCategories ?? [],
      partner: raw.partner || null,
      validFrom: raw.validFrom || null,
      validUntil: raw.validUntil || null,
      isActive: raw.isActive,
    };
    const id = this.couponId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.coupon.update(id, payload) : this.coupon.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Kupon je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/kuponi']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
