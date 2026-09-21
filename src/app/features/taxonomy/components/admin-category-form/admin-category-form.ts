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
import { Category } from '../../services/category';
import { CategoryAdminListItem } from '../../models/category';
import { CategoryDomain, CategoryEditPayload } from '../../models/category';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/categories/:id/edit) when an id is present in the route, otherwise
 * starts blank for a new category.
 *
 * Deliberate simplification for this pass (same precedent as admin-product-form's
 * longDescription / admin-blog-form's content): `longDescription`/`content` have
 * no dedicated editor UI here - both are kept in component fields (not form
 * controls) and merged back into the payload unchanged on submit.
 *
 * The parent picker is a flat `mat-select` (no indentation/hierarchy display, per
 * the spec) populated from listAdmin({ domain }) for whichever domain is
 * currently selected, excluding the category being edited itself (a category
 * can't be its own parent).
 */
@Component({
  selector: 'app-admin-category-form',
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
  templateUrl: './admin-category-form.html',
  styleUrl: './admin-category-form.scss',
})
export class AdminCategoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private category = inject(Category);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  categoryId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  parentOptions = signal<CategoryAdminListItem[]>([]);

  domainOptions: { value: CategoryDomain; label: string }[] = [
    { value: 'post', label: 'Blog' },
    { value: 'service', label: 'Usluga' },
    { value: 'product', label: 'Proizvod' },
  ];

  // Preserved unchanged from the loaded edit payload and merged back into the
  // submit payload as-is (see header comment) - no UI in this pass.
  private longDescription = '';
  private content: unknown[] = [];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: [''],
    domain: ['service' as CategoryDomain, Validators.required],
    parent: [null as string | null],
    shortDescription: ['', Validators.maxLength(300)],
    priority: [0, [Validators.min(0), Validators.max(999)]],
    isIndexable: [true],
    isActive: [true],
    featureImage: [null as ImageReference | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.form.get('domain')?.valueChanges.subscribe(() => {
      this.form.patchValue({ parent: null });
      this.loadParentOptions();
    });

    if (!id) {
      this.loadParentOptions();
      return;
    }

    this.categoryId.set(id);
    this.loading.set(true);
    this.category
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (category) => this.patchForm(category),
        error: () => this.snackBar.open('Greška pri učitavanju kategorije.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(category: CategoryEditPayload): void {
    this.form.patchValue({
      name: category.name,
      slug: category.slug ?? '',
      domain: category.domain,
      parent: category.parent ?? null,
      shortDescription: category.shortDescription ?? '',
      priority: category.priority ?? 0,
      isIndexable: category.isIndexable ?? true,
      isActive: category.isActive ?? true,
      featureImage: category.featureImage ?? null,
    });
    this.imagePreviewUrl.set(category.featureImage?.img ?? null);

    this.longDescription = category.longDescription ?? '';
    this.content = category.content ?? [];

    this.loadParentOptions();
  }

  private loadParentOptions(): void {
    const domain = this.form.get('domain')?.value as CategoryDomain;
    this.category.listAdmin({ domain, limit: 200 }).subscribe({
      next: ({ data }) => {
        const selfId = this.categoryId();
        this.parentOptions.set(selfId ? data.filter((c) => c.id !== selfId) : data);
      },
      error: () => this.parentOptions.set([]),
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.category
      .uploadImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.form.patchValue({ featureImage: reference });
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

    const raw = this.form.value;
    const payload: CategoryEditPayload = {
      name: raw.name,
      slug: raw.slug || undefined,
      domain: raw.domain,
      parent: raw.parent || null,
      shortDescription: raw.shortDescription,
      priority: raw.priority,
      isIndexable: raw.isIndexable,
      isActive: raw.isActive,
      featureImage: raw.featureImage,
      longDescription: this.longDescription,
      content: this.content,
    };
    const id = this.categoryId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.category.update(id, payload) : this.category.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Kategorija je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/kategorije']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
