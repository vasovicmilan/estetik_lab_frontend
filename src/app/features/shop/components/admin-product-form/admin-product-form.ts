import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { RepeaterField, RepeaterSubfield } from '../../../../shared/ui/repeater-field/repeater-field';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ImageReference } from '../../../../core/models/upload';
import { ContentBlock } from '../../../../core/models/content-block';
import { Product } from '../../services/product';
import { ProductEditPayload, ProductFaqEntry } from '../../models/product';
import { Category } from '../../../taxonomy/services/category';
import { Tag } from '../../../taxonomy/services/tag';
import { CategoryAdminListItem } from '../../../taxonomy/models/category';
import { TagAdminListItem } from '../../../taxonomy/models/tag';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/products/:id/edit) when an id is present in the route, otherwise
 * starts blank for a new product.
 *
 * Deliberate simplification (per the shop feature spec): `longDescription` is
 * content-blocks (an array), not a plain string like Service/Package's
 * description, and this pass does NOT build a rich block editor for it - too
 * complex for a v1 store. The loaded value is kept in a component field
 * (`longDescription`, not bound to any form control) and merged back into the
 * payload unchanged on submit. Same treatment for `relatedProducts`/
 * `relatedServices`/`relatedPosts`/`faq`/`seoKeywords` - no UI for editing them
 * in this pass, but nothing is lost on save.
 *
 * `categories`/`tags` USED to be plain comma-separated ObjectId text inputs (an
 * explicit v1 limitation, per this file's earlier comment) - now that Category/Tag
 * have a real listAdmin endpoint (see features/taxonomy), they're proper
 * `mat-select multiple` pickers instead, filtered to domain: 'product'. The
 * FormControls still carry plain `string[]` of ObjectIds - only the input widget
 * changed, not the payload shape.
 */
@Component({
  selector: 'app-admin-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    RepeaterField,
    ImageUrlPipe,
  ],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.scss',
})
export class AdminProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private product = inject(Product);
  private category = inject(Category);
  private tag = inject(Tag);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  productId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);
  categoryOptions = signal<CategoryAdminListItem[]>([]);
  tagOptions = signal<TagAdminListItem[]>([]);

  // Fields this pass has no dedicated UI for - preserved unchanged from the loaded
  // edit payload and merged back into the submit payload as-is (see header comment).
  private longDescription: ContentBlock[] = [];
  private relatedProducts: string[] = [];
  private relatedServices: string[] = [];
  private relatedPosts: string[] = [];
  private faq: ProductFaqEntry[] = [];
  private seoKeywords: string[] = [];

  // Matches RawVariation (see models/product.ts's ProductVariation) - the `_id`
  // hidden field preserves a row's identity across an edit, same as
  // admin-service-form's variantSchema. `image`/`order` are skipped per-row to
  // keep the repeater usable (an acceptable simplification for this pass).
  variantSchema: RepeaterSubfield[] = [
    { name: '_id', label: '', type: 'hidden' },
    { name: 'label', label: 'Naziv varijante', type: 'text' },
    { name: 'price', label: 'Cena', type: 'number' },
    { name: 'compareAtPrice', label: 'Stara cena', type: 'number' },
    { name: 'sku', label: 'SKU', type: 'text' },
    { name: 'stock', label: 'Stanje', type: 'number' },
    { name: 'lowStockThreshold', label: 'Prag niskog stanja', type: 'number' },
    { name: 'isBest', label: 'Najbolja opcija', type: 'checkbox' },
    { name: 'isActive', label: 'Aktivna', type: 'checkbox' },
  ];

  badgeOptions = [
    { value: 'none', label: 'Nijedna' },
    { value: 'featured', label: 'Istaknuto' },
    { value: 'sale', label: 'Na akciji' },
  ];

  shippingClassOptions = [
    { value: 'standard', label: 'Redovna pošta' },
    { value: 'freight', label: 'Veliki artikal' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    slug: [''],
    sku: [''],
    shortDescription: ['', Validators.maxLength(300)],
    badge: ['none'],
    shippingClass: ['standard'],
    priceOnRequest: [false],
    isActive: [false],
    categories: [[] as string[]],
    tags: [[] as string[]],
    variations: this.fb.array<FormGroup>([]),
    image: [null as ImageReference | null],
    gallery: [[] as ImageReference[]],
  });

  get variations(): FormArray<FormGroup> {
    return this.form.get('variations') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.category.listAdmin({ domain: 'product', limit: 200 }).subscribe({
      next: ({ data }) => this.categoryOptions.set(data),
      error: () => this.categoryOptions.set([]),
    });
    this.tag.listAdmin({ domain: 'product', limit: 200 }).subscribe({
      next: ({ data }) => this.tagOptions.set(data),
      error: () => this.tagOptions.set([]),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.productId.set(id);
    this.loading.set(true);
    this.product
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => this.patchForm(product),
        error: () => this.snackBar.open('Greška pri učitavanju proizvoda.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(product: ProductEditPayload): void {
    this.form.patchValue({
      name: product.name,
      slug: product.slug ?? '',
      sku: product.sku ?? '',
      shortDescription: product.shortDescription ?? '',
      badge: product.badge ?? 'none',
      shippingClass: product.shippingClass ?? 'standard',
      priceOnRequest: product.priceOnRequest ?? false,
      isActive: product.isActive ?? false,
      categories: product.categories ?? [],
      tags: product.tags ?? [],
      image: product.image ?? null,
      gallery: product.gallery ?? [],
    });
    this.imagePreviewUrl.set(product.image?.img ?? null);
    this.galleryPreview.set(product.gallery ?? []);

    this.longDescription = product.longDescription ?? [];
    this.relatedProducts = product.relatedProducts ?? [];
    this.relatedServices = product.relatedServices ?? [];
    this.relatedPosts = product.relatedPosts ?? [];
    this.faq = product.faq ?? [];
    this.seoKeywords = product.seoKeywords ?? [];

    this.variations.clear();
    for (const variant of product.variations ?? []) {
      this.variations.push(
        this.fb.group({
          _id: [variant._id ?? ''],
          label: [variant.label, Validators.required],
          price: [variant.price, [Validators.required, Validators.min(0)]],
          compareAtPrice: [variant.compareAtPrice ?? null],
          sku: [variant.sku ?? ''],
          stock: [variant.stock, [Validators.required, Validators.min(0)]],
          lowStockThreshold: [variant.lowStockThreshold ?? null],
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
    this.product
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
    this.product
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // form.value has the form-editable fields; the rest of the payload comes from
    // whatever the loaded edit payload carried (see the header comment).
    const payload: ProductEditPayload = {
      ...this.form.value,
      longDescription: this.longDescription,
      relatedProducts: this.relatedProducts,
      relatedServices: this.relatedServices,
      relatedPosts: this.relatedPosts,
      faq: this.faq,
      seoKeywords: this.seoKeywords,
    };
    const id = this.productId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.product.update(id, payload) : this.product.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Proizvod je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/prodavnica']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
