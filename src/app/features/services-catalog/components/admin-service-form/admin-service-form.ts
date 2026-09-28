import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { RepeaterField, RepeaterSubfield } from '../../../../shared/ui/repeater-field/repeater-field';
import { ImageReference } from '../../../../core/models/upload';
import { Service } from '../../services/service';
import { ServiceEditPayload } from '../../models/service';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FileUpload } from '../../../../shared/ui/file-upload/file-upload';

/**
 * One vertical slice, end to end: loads the RAW edit shape (not the display shape -
 * see service.ts's getForEdit() comment), edits "Varijante usluge" through the
 * generic repeater (the Angular equivalent of admin-repeater.js discussed earlier),
 * uploads an image through the /api/v1/admin/uploads/services endpoint, and
 * submits a plain JSON body that matches exactly what admin-catalog.controller.js's
 * createService/updateService already expect.
 *
 * `seoKeywords` is edited as a comma-separated text input (same convention as
 * admin-blog-form's SEO step / admin-product-form) but saved through its own
 * PUT admin/services/:id/seo endpoint as a follow-up call after create/update
 * succeeds, not as part of the main payload above - see Service.updateSeo()'s
 * comment. Keywords-only: the backend has no seoTitle/seoDescription for a service.
 */
@Component({
  selector: 'app-admin-service-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    RepeaterField,
    FormLayout,
    FormSection,
    FormActions,
    FileUpload,
  ],
  templateUrl: './admin-service-form.html',
  styleUrl: './admin-service-form.scss',
})
export class AdminServiceForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(Service);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  serviceId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  /** Set on the first failed submit attempt - gates the alt-text "obavezno"
   * message so it doesn't show up front on a blank new-service form (same
   * pattern as admin-blog-form's `submitted`). */
  submitted = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);

  // Matches ServicePackageSchema exactly (see models/service.ts's ServiceVariant) -
  // the `_id` hidden field is what preserves a row's identity across an edit.
  variantSchema: RepeaterSubfield[] = [
    { name: '_id', label: '', type: 'hidden' },
    { name: 'name', label: 'Naziv varijante', type: 'text' },
    { name: 'slug', label: 'Slug', type: 'text' },
    { name: 'sessions', label: 'Broj seansi', type: 'number' },
    { name: 'duration', label: 'Trajanje (min)', type: 'number' },
    { name: 'totalPrice', label: 'Cena', type: 'number' },
    { name: 'basePrice', label: 'Stara cena', type: 'number' },
    { name: 'badge', label: 'Oznaka', type: 'text' },
    { name: 'isBest', label: 'Najbolja opcija', type: 'checkbox' },
    { name: 'isActive', label: 'Aktivna', type: 'checkbox' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    slug: [''],
    shortDescription: ['', Validators.maxLength(300)],
    defaultDuration: [60, [Validators.required, Validators.min(5)]],
    isActive: [false],
    packages: this.fb.array<FormGroup>([]),
    image: [null as { img: string; imgDesc: string } | null],
    gallery: [[] as ImageReference[]],
    seoKeywords: [''],
  });

  get packages(): FormArray<FormGroup> {
    return this.form.get('packages') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.serviceId.set(id);
    this.loading.set(true);
    this.service
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (service) => this.patchForm(service),
        error: () => this.snackBar.open('Greška pri učitavanju usluge.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(service: ServiceEditPayload): void {
    this.form.patchValue({
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription ?? '',
      defaultDuration: service.defaultDuration ?? 60,
      isActive: service.isActive ?? false,
      image: service.image ?? null,
      gallery: service.gallery ?? [],
      seoKeywords: (service.seoKeywords ?? []).join(', '),
    });
    this.imagePreviewUrl.set(service.image?.img ?? null);
    this.galleryPreview.set(service.gallery ?? []);

    this.packages.clear();
    for (const variant of service.packages ?? []) {
      this.packages.push(
        this.fb.group({
          _id: [variant._id ?? ''],
          name: [variant.name, Validators.required],
          slug: [variant.slug, Validators.required],
          sessions: [variant.sessions, [Validators.required, Validators.min(1)]],
          duration: [variant.duration, [Validators.required, Validators.min(5)]],
          totalPrice: [variant.totalPrice, [Validators.required, Validators.min(0)]],
          basePrice: [variant.basePrice ?? null],
          badge: [variant.badge ?? ''],
          isBest: [variant.isBest ?? false],
          isActive: [variant.isActive ?? true],
        })
      );
    }
  }

  onImageSelected(file: File): void {
    this.uploadingImage.set(true);
    this.service
      .uploadImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.form.patchValue({ image: { img: reference.img, imgDesc: reference.imgDesc } });
          this.imagePreviewUrl.set(reference.img);
        },
        error: () => this.snackBar.open('Upload slike nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: null });
    this.imagePreviewUrl.set(null);
  }

  onCoverAltChanged(value: string): void {
    const cover = this.form.get('image')?.value as { img: string; imgDesc: string } | null;
    if (!cover) return;
    this.form.patchValue({ image: { ...cover, imgDesc: value } });
  }

  /** ImageSchema.imgDesc is a required Mongoose field - an empty alt text
   * would fail to save even though the image itself uploaded fine. The image
   * itself isn't required for a service, so this only blocks submit when one
   * is actually present. */
  coverImageAltSatisfied(): boolean {
    const cover = this.form.get('image')?.value as { img: string; imgDesc: string } | null;
    return !cover || !!cover.imgDesc?.trim();
  }

  // ---- Gallery (+ required alt text per image, 10-image cap - matches the
  // backend's uploadGalleryMiddleware maxCount, see admin-uploads.controller.js) ----

  galleryCount(): number {
    return this.galleryPreview().length;
  }

  galleryAtCap(): boolean {
    return this.galleryCount() >= 10;
  }

  /** Mirrors the backend's required-imgDesc rule for every gallery image. */
  galleryAltSatisfied(): boolean {
    return this.galleryPreview().every((img) => !!img.imgDesc?.trim());
  }

  onGallerySelected(files: File[]): void {
    if (!files.length) return;

    const remainingSlots = 10 - this.galleryCount();
    if (remainingSlots <= 0) {
      this.snackBar.open('Galerija je već popunjena (10/10 slika).', 'U redu', { duration: 4000 });
      return;
    }
    const toUpload = files.slice(0, remainingSlots);
    if (toUpload.length < files.length) {
      this.snackBar.open(`Otpremljeno je samo ${toUpload.length} od ${files.length} slika (limit je 10 po galeriji).`, 'U redu', {
        duration: 5000,
      });
    }

    this.uploadingGallery.set(true);
    this.service
      .uploadGallery(toUpload)
      .pipe(finalize(() => this.uploadingGallery.set(false)))
      .subscribe({
        next: (references) => {
          const merged = [...this.galleryPreview(), ...references];
          this.form.patchValue({ gallery: merged });
          this.galleryPreview.set(merged);
        },
        error: () => this.snackBar.open('Upload galerije nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  onGalleryImageRemoved(index: number): void {
    const remaining = this.galleryPreview().filter((_, i) => i !== index);
    this.form.patchValue({ gallery: remaining });
    this.galleryPreview.set(remaining);
  }

  onGalleryAltChanged(index: number, value: string): void {
    const updated = this.galleryPreview().map((img, i) => (i === index ? { ...img, imgDesc: value } : img));
    this.form.patchValue({ gallery: updated });
    this.galleryPreview.set(updated);
  }

  submit(): void {
    const altTextOk = this.coverImageAltSatisfied() && this.galleryAltSatisfied();

    if (this.form.invalid || !altTextOk) {
      this.form.markAllAsTouched();
      this.submitted.set(true);
      return;
    }

    // form.value is already the exact JSON shape createService/updateService expect
    // (see admin-catalog.controller.js) - no stringify/parse round-trip needed, the
    // way the old EJS admin-repeater.js widget had to for a plain form POST.
    // seoKeywords is pulled out separately - it's saved through its own endpoint
    // below, not the create/update payload (same split as admin-blog-form's SEO step).
    const { seoKeywords, ...payload } = this.form.value as ServiceEditPayload & { seoKeywords?: string };
    const id = this.serviceId();

    this.saving.set(true);
    // Typed as Observable<unknown> because create()/update() resolve to different
    // response shapes (ServiceEditPayload vs ServiceDetail) - submit() only cares
    // whether the request succeeded, not the shape of what comes back.
    const request$: Observable<{ id?: string }> = id
      ? this.service.update(id, payload)
      : this.service.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        const savedId = id ?? saved?.id;
        // SEO is a separate endpoint (see Service.updateSeo()'s comment) - only
        // callable once the service has an id, so it's a follow-up call rather
        // than part of the create/update payload above. Best-effort: a failed
        // SEO save shouldn't make the person think the whole service failed to
        // save, since it plainly did.
        if (savedId) {
          this.service
            .updateSeo(savedId, { seoKeywords: seoKeywords || undefined })
            .subscribe({ error: () => this.snackBar.open('Usluga je sačuvana, ali SEO podaci nisu uspeli.', 'U redu', { duration: 4000 }) });
        }
        this.snackBar.open('Usluga je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/usluge']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
