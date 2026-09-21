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
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Service } from '../../services/service';
import { ServiceEditPayload } from '../../models/service';

/**
 * One vertical slice, end to end: loads the RAW edit shape (not the display shape -
 * see service.ts's getForEdit() comment), edits "Varijante usluge" through the
 * generic repeater (the Angular equivalent of admin-repeater.js discussed earlier),
 * uploads an image through the /api/v1/admin/uploads/services endpoint, and
 * submits a plain JSON body that matches exactly what admin-catalog.controller.js's
 * createService/updateService already expect.
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
    ImageUrlPipe,
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
  uploadingImage = signal(false);
  imagePreviewUrl = signal<string | null>(null);

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
    });
    this.imagePreviewUrl.set(service.image?.img ?? null);

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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // form.value is already the exact JSON shape createService/updateService expect
    // (see admin-catalog.controller.js) - no stringify/parse round-trip needed, the
    // way the old EJS admin-repeater.js widget had to for a plain form POST.
    const payload: ServiceEditPayload = this.form.value;
    const id = this.serviceId();

    this.saving.set(true);
    // Typed as Observable<unknown> because create()/update() resolve to different
    // response shapes (ServiceEditPayload vs ServiceDetail) - submit() only cares
    // whether the request succeeded, not the shape of what comes back.
    const request$: Observable<unknown> = id
      ? this.service.update(id, payload)
      : this.service.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Usluga je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/usluge']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
