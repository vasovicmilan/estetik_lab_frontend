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
import { Package } from '../../services/package';
import { PackageCreatePayload, PackageEditPayload } from '../../models/package';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FileUpload } from '../../../../shared/ui/file-upload/file-upload';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/packages/:id/edit - added alongside this frontend work, see
 * models/package.ts's header comment) when an id is present in the route,
 * otherwise starts blank for a new package.
 */
@Component({
  selector: 'app-admin-package-form',
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
  templateUrl: './admin-package-form.html',
  styleUrl: './admin-package-form.scss',
})
export class AdminPackageForm implements OnInit {
  private fb = inject(FormBuilder);
  private pkg = inject(Package);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  packageId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  /** Set on the first failed submit attempt - gates the "obavezno" alt-text/
   * cover-image messages so nothing shows up front on a blank new-package form
   * (same pattern as admin-blog-form's/admin-service-form's `submitted`). */
  submitted = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);

  // service/servicePackageId are raw Mongo ids for now (no service-picker
  // autocomplete built yet) - see mapPackageForEdit's `items` shape on the backend.
  itemSchema: RepeaterSubfield[] = [
    { name: 'service', label: 'ID usluge', type: 'text' },
    { name: 'servicePackageId', label: 'ID varijante usluge', type: 'text' },
    { name: 'sessions', label: 'Broj seansi', type: 'number' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    slug: [''],
    description: ['', Validators.required],
    shortDescription: [''],
    totalPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    basePrice: [null as number | null],
    isBest: [false],
    isActive: [true],
    items: this.fb.array<FormGroup>([]),
    image: [null as ImageReference | null],
    gallery: [[] as ImageReference[]],
  });

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.packageId.set(id);
    this.loading.set(true);
    this.pkg
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (pkg) => this.patchForm(pkg),
        error: () => this.snackBar.open('Greška pri učitavanju paketa.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(pkg: PackageEditPayload): void {
    this.form.patchValue({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      shortDescription: pkg.shortDescription ?? '',
      totalPrice: pkg.totalPrice,
      basePrice: pkg.basePrice ?? null,
      isBest: pkg.isBest ?? false,
      isActive: pkg.isActive ?? true,
      image: pkg.image ?? null,
      gallery: pkg.gallery ?? [],
    });
    this.imagePreviewUrl.set(pkg.image?.img ?? null);
    this.galleryPreview.set(pkg.gallery ?? []);

    this.items.clear();
    for (const item of pkg.items ?? []) {
      this.items.push(
        this.fb.group({
          service: [item.service, Validators.required],
          servicePackageId: [item.servicePackageId, Validators.required],
          sessions: [item.sessions, [Validators.required, Validators.min(1)]],
        })
      );
    }
  }

  // ---- Cover image (+ required alt text) ----

  /** Cover image is required by this form even though PackageSchema itself
   * doesn't mark `image` as required at the DB level (see package.model.js) -
   * every package should have a presentable cover on the public site. */
  coverImageSatisfied(): boolean {
    return !!this.form.get('image')?.value;
  }

  /** ImageSchema.imgDesc is a required Mongoose field - an empty alt text
   * would fail to save even though the image itself uploaded fine. */
  coverImageAltSatisfied(): boolean {
    const cover = this.form.get('image')?.value as ImageReference | null;
    return !cover || !!cover.imgDesc?.trim();
  }

  onImageSelected(file: File): void {
    this.uploadingImage.set(true);
    this.pkg
      .uploadImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.form.patchValue({ image: reference });
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
    const cover = this.form.get('image')?.value as ImageReference | null;
    if (!cover) return;
    this.form.patchValue({ image: { ...cover, imgDesc: value } });
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
    this.pkg
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
    const requiredFieldsOk = this.coverImageSatisfied() && this.coverImageAltSatisfied() && this.galleryAltSatisfied();

    if (this.form.invalid || this.items.length === 0 || !requiredFieldsOk) {
      this.form.markAllAsTouched();
      this.submitted.set(true);
      if (this.items.length === 0) {
        this.snackBar.open('Paket mora sadržati bar jednu uslugu.', 'U redu', { duration: 4000 });
      }
      return;
    }

    const payload: PackageCreatePayload = this.form.value;
    const id = this.packageId();

    this.saving.set(true);
    // Typed as Observable<unknown> for the same reason as admin-service-form's
    // submit(): create()/update() resolve to different response shapes, and
    // submit() only cares whether the request succeeded.
    const request$: Observable<unknown> = id ? this.pkg.update(id, payload) : this.pkg.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Paket je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/paketi']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
