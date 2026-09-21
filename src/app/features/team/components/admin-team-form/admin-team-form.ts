import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ImageReference } from '../../../../core/models/upload';
import { Team } from '../../services/team';
import { ExpertEditPayload } from '../../models/expert';
import { Service } from '../../../services-catalog/services/service';
import { ServiceListItem } from '../../../services-catalog/models/service';

/**
 * Create + edit, same pattern as admin-service-form/admin-product-form: loads the
 * RAW edit shape (GET /admin/experts/:id/edit - just added alongside this frontend
 * work) when an id is present in the route, otherwise starts blank for a new
 * expert.
 *
 * Unlike Service/Product, `image` is REQUIRED at the DB level for a new expert
 * (expert.service.js's createExpert throws if `!data.image?.img`) - so the submit
 * button here stays disabled on create until an image has been uploaded; an
 * existing image on edit already satisfies that (see `imageSatisfied()`).
 *
 * `specializations` is a free-form string array with no dedicated picker
 * component (it's descriptive tags, not an ID reference) - still edited as a
 * simple comma-separated text field, split/joined on "," on load/submit.
 *
 * `services` IS an ObjectId array of related Service docs, though - it now uses a
 * `mat-select multiple` populated from Service.listAdmin(), showing each
 * service's name (`naziv`) as the option label and its `id` as the value. The
 * FormControl still carries plain `string[]`, same shape the backend expects.
 */
@Component({
  selector: 'app-admin-team-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-team-form.html',
  styleUrl: './admin-team-form.scss',
})
export class AdminTeamForm implements OnInit {
  private fb = inject(FormBuilder);
  private team = inject(Team);
  private service = inject(Service);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  expertId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);
  serviceOptions = signal<ServiceListItem[]>([]);

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    slug: [''],
    title: [''],
    shortBio: ['', Validators.maxLength(300)],
    bio: [''],
    specializations: [''],
    services: [[] as string[]],
    instagram: [''],
    facebook: [''],
    linkedin: [''],
    website: [''],
    isActive: [true],
    order: [0, [Validators.min(0)]],
    image: [null as ImageReference | null],
    gallery: [[] as ImageReference[]],
  });

  ngOnInit(): void {
    this.service.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => this.serviceOptions.set(data),
      error: () => this.serviceOptions.set([]),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.expertId.set(id);
    this.loading.set(true);
    this.team
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (expert) => this.patchForm(expert),
        error: () => this.snackBar.open('Greška pri učitavanju člana tima.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(expert: ExpertEditPayload): void {
    this.form.patchValue({
      firstName: expert.firstName,
      lastName: expert.lastName,
      slug: expert.slug ?? '',
      title: expert.title ?? '',
      shortBio: expert.shortBio ?? '',
      bio: expert.bio ?? '',
      specializations: (expert.specializations ?? []).join(', '),
      services: expert.services ?? [],
      instagram: expert.socialLinks?.instagram ?? '',
      facebook: expert.socialLinks?.facebook ?? '',
      linkedin: expert.socialLinks?.linkedin ?? '',
      website: expert.socialLinks?.website ?? '',
      isActive: expert.isActive ?? true,
      order: expert.order ?? 0,
      image: expert.image ?? null,
      gallery: expert.gallery ?? [],
    });
    this.imagePreviewUrl.set(expert.image?.img ?? null);
    this.galleryPreview.set(expert.gallery ?? []);
  }

  /** Create requires an uploaded image (backend rejects createExpert without one);
   * edit already has one loaded from the server unless explicitly cleared. */
  imageSatisfied(): boolean {
    return !!this.form.get('image')?.value;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.team
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

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    this.uploadingGallery.set(true);
    this.team
      .uploadGallery(files)
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

  submit(): void {
    if (this.form.invalid || !this.imageSatisfied()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: ExpertEditPayload = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      slug: raw.slug || undefined,
      title: raw.title || undefined,
      shortBio: raw.shortBio || undefined,
      bio: raw.bio || undefined,
      specializations: this.splitList(raw.specializations),
      services: raw.services,
      socialLinks: {
        instagram: raw.instagram || undefined,
        facebook: raw.facebook || undefined,
        linkedin: raw.linkedin || undefined,
        website: raw.website || undefined,
      },
      isActive: raw.isActive,
      order: raw.order ?? 0,
      image: raw.image,
      gallery: raw.gallery,
    };
    const id = this.expertId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.team.update(id, payload) : this.team.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Član tima je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/tim']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }

  private splitList(value: string): string[] {
    return (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
