import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { BusinessPartner } from '../../services/business-partner';
import { BusinessPartnerCoverImage, BusinessPartnerEditPayload, BusinessPartnerWritePayload } from '../../models/business-partner';

/**
 * Create + edit, same pattern as admin-category-form: loads the RAW edit shape
 * (GET /admin/business-partners/:id/edit) when an id is present in the route,
 * otherwise starts blank for a new business partner.
 *
 * Deliberate simplification for this pass (same precedent as admin-category-form's
 * longDescription/content): `content` has no dedicated block editor UI here - it's
 * kept in a private component field (not a form control) and merged back into the
 * payload unchanged on submit.
 *
 * `coverImage` is REQUIRED on create (the backend 400s without it) - uploaded via
 * BusinessPartner.uploadImage() exactly like admin-category-form's
 * onImageSelected(), with the same preview. Submit stays disabled until an image
 * is set on create; on edit the existing image is preloaded and re-upload is
 * optional (only replaces coverImage if the admin picks a new file).
 *
 * latitude/longitude are both optional, plain number inputs - no paired
 * required-together validation in this pass, per the task's "don't
 * over-engineer" note.
 */
@Component({
  selector: 'app-admin-business-partner-form',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-business-partner-form.html',
  styleUrl: './admin-business-partner-form.scss',
})
export class AdminBusinessPartnerForm implements OnInit {
  private fb = inject(FormBuilder);
  private businessPartner = inject(BusinessPartner);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  partnerId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  imagePreviewUrl = signal<string | null>(null);

  // Preserved unchanged from the loaded edit payload and merged back into the
  // submit payload as-is (see header comment) - no UI in this pass.
  private content: unknown[] = [];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: [''],
    shortDescription: ['', [Validators.required, Validators.maxLength(300)]],
    address: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    outboundUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    ctaLabel: ['', Validators.maxLength(40)],
    isActive: [true],
    coverImage: [null as BusinessPartnerCoverImage | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.partnerId.set(id);
    this.loading.set(true);
    this.businessPartner
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.patchForm(payload),
        error: () => this.snackBar.open('Greška pri učitavanju saradnika.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(payload: BusinessPartnerEditPayload): void {
    this.form.patchValue({
      name: payload.name,
      slug: payload.slug ?? '',
      shortDescription: payload.shortDescription ?? '',
      address: payload.address ?? '',
      latitude: payload.latitude === '' || payload.latitude == null ? null : Number(payload.latitude),
      longitude: payload.longitude === '' || payload.longitude == null ? null : Number(payload.longitude),
      outboundUrl: payload.outboundUrl ?? '',
      ctaLabel: payload.ctaLabel ?? '',
      isActive: payload.isActive ?? true,
      coverImage: payload.coverImage ?? null,
    });
    this.imagePreviewUrl.set(payload.coverImage?.img ?? null);

    this.content = payload.content ?? [];
  }

  /** Required-on-create gate: on create there's no submit until an image is
   * picked; on edit the loaded coverImage already satisfies it. */
  get canSubmit(): boolean {
    if (this.saving() || this.form.invalid) return false;
    if (this.partnerId()) return true;
    return !!this.form.get('coverImage')?.value;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.businessPartner
      .uploadImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.form.patchValue({ coverImage: reference });
          this.imagePreviewUrl.set(reference.img);
        },
        error: () => this.snackBar.open('Upload slike nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  submit(): void {
    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: BusinessPartnerWritePayload = {
      name: raw.name,
      slug: raw.slug || undefined,
      shortDescription: raw.shortDescription,
      address: raw.address || undefined,
      latitude: raw.latitude ?? undefined,
      longitude: raw.longitude ?? undefined,
      outboundUrl: raw.outboundUrl,
      ctaLabel: raw.ctaLabel || undefined,
      isActive: raw.isActive,
      coverImage: raw.coverImage,
      content: this.content,
    };
    const id = this.partnerId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.businessPartner.update(id, payload) : this.businessPartner.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Poslovni saradnik je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/poslovni-saradnici']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
