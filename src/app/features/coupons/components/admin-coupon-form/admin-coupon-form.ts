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
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, Observable } from 'rxjs';
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
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { DatePicker } from '../../../../shared/ui/date-picker/date-picker';

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
 * `productDiscountEnabled` checkbox, per the task's field spec. It lives
 * inside the "Pravila popusta" step (see `form`) rather than its own step,
 * since it's fundamentally more discount configuration, not a separate concern.
 *
 * STEPPER: per the business owner's feedback, this is the first `mat-stepper`
 * usage in the codebase (a reference example for later complex-form
 * migrations) - one step per former `FormSection` (Osnovni podaci / Pravila
 * popusta / Važnost / Ograničenja upotrebe), `linear` so a step with invalid
 * fields blocks moving forward, each with its own nested `FormGroup` bound via
 * `[stepControl]` (Material's documented reactive-forms stepper pattern).
 * Nesting was chosen over flat-group + manual per-step validity checks because
 * there are zero cross-group validators/values here (`validUntil`'s `[min]`
 * binding is a UI hint, not a validator) - `code`/`discountValue`/etc.'s
 * validators are all local to their own control, so splitting the single flat
 * group into 4 nested ones needed no validator surgery, only updating
 * `patchForm()`/`submit()` to read/write the new nested paths instead of
 * top-level ones.
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
    MatStepperModule,
    FormLayout,
    FormSection,
    FormActions,
    DatePicker,
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
  private breakpointObserver = inject(BreakpointObserver);

  couponId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  /** Same breakpoint DataTable/AdminShell already established (see DataTable's
   * `isHandset` for the rationale) - a horizontal stepper with 4 steps is
   * cramped on a phone, so it switches to vertical below that width. */
  private isHandset = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  stepperOrientation = () => (this.isHandset() ? 'vertical' : 'horizontal');

  serviceOptions = signal<ServiceListItem[]>([]);
  packageOptions = signal<PackageListItem[]>([]);
  productOptions = signal<ProductAdminListItem[]>([]);
  categoryOptions = signal<CategoryAdminListItem[]>([]);
  partnerOptions = signal<PartnerAdminListItem[]>([]);

  discountTypeOptions: { value: CouponDiscountType; label: string }[] = [
    { value: 'percentage', label: 'Procenat' },
    { value: 'fixed', label: 'Fiksni iznos' },
  ];

  // One nested FormGroup per stepper step (see class doc comment for why
  // nesting was chosen over a flat group + manual per-step validity checks).
  // `form.get('<step>.<field>')` reaches any control from outside; the
  // template additionally uses `formGroupName="<step>"` on each step's
  // `app-form-section` so its own field bindings stay unqualified.
  form: FormGroup = this.fb.group({
    basicInfo: this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      partner: [null as string | null],
      isActive: [true],
    }),
    discountRules: this.fb.group({
      discountType: ['percentage' as CouponDiscountType, Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      maxDiscountAmount: [null as number | null, Validators.min(0)],
      minValue: [0, Validators.min(0)],
      applicableServices: [[] as string[]],
      applicablePackages: [[] as string[]],
      productDiscountEnabled: [false],
      productDiscountType: ['percentage' as CouponDiscountType],
      productDiscountValue: [0, Validators.min(0)],
      productDiscountMaxAmount: [null as number | null, Validators.min(0)],
      productMinOrderValue: [0, Validators.min(0)],
      applicableProducts: [[] as string[]],
      excludedCategories: [[] as string[]],
    }),
    validity: this.fb.group({
      // Date | null (DatePicker's ControlValueAccessor value type) - converted
      // to/from an ISO date string at the API boundary in patchForm()/submit(),
      // same as the plain <input type="date"> fields did before.
      validFrom: [null as Date | null],
      validUntil: [null as Date | null],
    }),
    usageLimits: this.fb.group({
      maxUses: [null as number | null, [Validators.min(0)]],
      maxUsesPerUser: [null as number | null, [Validators.min(0)]],
    }),
  });

  // Typed handles to each step's group - used for [stepControl] and by the
  // template's per-step error checks (form.get('basicInfo.code') also works,
  // these just avoid repeating that lookup/cast everywhere).
  get basicInfoGroup(): FormGroup {
    return this.form.get('basicInfo') as FormGroup;
  }
  get discountRulesGroup(): FormGroup {
    return this.form.get('discountRules') as FormGroup;
  }
  get validityGroup(): FormGroup {
    return this.form.get('validity') as FormGroup;
  }
  get usageLimitsGroup(): FormGroup {
    return this.form.get('usageLimits') as FormGroup;
  }

  /** Bound to each step's Next button - `matStepperNext` already blocks
   * advancing while the step's `stepControl` is invalid (linear mode), but it
   * doesn't itself surface *why* by marking controls touched, so the user
   * would otherwise see a stuck button with no visible errors. */
  revealErrors(group: FormGroup): void {
    group.markAllAsTouched();
  }

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
      basicInfo: {
        code: payload.code,
        partner: payload.partner,
        isActive: payload.isActive,
      },
      discountRules: {
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxDiscountAmount: payload.maxDiscountAmount,
        minValue: payload.minValue,
        applicableServices: payload.applicableServices ?? [],
        applicablePackages: payload.applicablePackages ?? [],
        productDiscountEnabled: payload.productDiscountEnabled,
        productDiscountType: payload.productDiscountType,
        productDiscountValue: payload.productDiscountValue,
        productDiscountMaxAmount: payload.productDiscountMaxAmount,
        productMinOrderValue: payload.productMinOrderValue,
        applicableProducts: payload.applicableProducts ?? [],
        excludedCategories: payload.excludedCategories ?? [],
      },
      validity: {
        validFrom: payload.validFrom ? new Date(payload.validFrom) : null,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      },
      usageLimits: {
        maxUses: payload.maxUses,
        maxUsesPerUser: payload.maxUsesPerUser,
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const basicInfo = raw.basicInfo;
    const discountRules = raw.discountRules;
    const validity = raw.validity;
    const usageLimits = raw.usageLimits;
    const payload: CouponWritePayload = {
      code: basicInfo.code,
      discountType: discountRules.discountType,
      discountValue: discountRules.discountValue,
      maxDiscountAmount: discountRules.maxDiscountAmount === '' ? null : discountRules.maxDiscountAmount,
      minValue: discountRules.minValue ?? 0,
      maxUses: usageLimits.maxUses === '' || usageLimits.maxUses == null ? null : usageLimits.maxUses,
      maxUsesPerUser: usageLimits.maxUsesPerUser === '' || usageLimits.maxUsesPerUser == null ? null : usageLimits.maxUsesPerUser,
      applicableServices: discountRules.applicableServices ?? [],
      applicablePackages: discountRules.applicablePackages ?? [],
      productDiscountEnabled: discountRules.productDiscountEnabled,
      productDiscountType: discountRules.productDiscountType,
      productDiscountValue: discountRules.productDiscountValue ?? 0,
      productDiscountMaxAmount: discountRules.productDiscountMaxAmount === '' ? null : discountRules.productDiscountMaxAmount,
      productMinOrderValue: discountRules.productMinOrderValue ?? 0,
      applicableProducts: discountRules.applicableProducts ?? [],
      excludedCategories: discountRules.excludedCategories ?? [],
      partner: basicInfo.partner || null,
      // DatePicker hands back a Date | null - convert to the yyyy-MM-dd ISO
      // date string the API expects (CouponWritePayload.validFrom/validUntil
      // stayed string | null), matching DatePicker's own documented
      // conversion convention.
      validFrom: (validity.validFrom as Date | null)?.toISOString().slice(0, 10) ?? null,
      validUntil: (validity.validUntil as Date | null)?.toISOString().slice(0, 10) ?? null,
      isActive: basicInfo.isActive,
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
