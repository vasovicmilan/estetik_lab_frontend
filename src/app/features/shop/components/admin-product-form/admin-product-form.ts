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
import { ImageReference } from '../../../../core/models/upload';
import { ContentBlock } from '../../../../core/models/content-block';
import { Product } from '../../services/product';
import { ProductEditPayload, ProductFaqEntry } from '../../models/product';
import { Category } from '../../../taxonomy/services/category';
import { Tag } from '../../../taxonomy/services/tag';
import { CategoryAdminListItem } from '../../../taxonomy/models/category';
import { TagAdminListItem } from '../../../taxonomy/models/tag';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FileUpload } from '../../../../shared/ui/file-upload/file-upload';

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
 * `relatedServices`/`relatedPosts`/`faq` - no UI for editing them in this pass,
 * but nothing is lost on save. (`seoKeywords` DOES have a dedicated field now -
 * see below.)
 *
 * `categories`/`tags` USED to be plain comma-separated ObjectId text inputs (an
 * explicit v1 limitation, per this file's earlier comment) - now that Category/Tag
 * have a real listAdmin endpoint (see features/taxonomy), they're proper
 * `mat-select multiple` pickers instead, filtered to domain: 'product'. The
 * FormControls still carry plain `string[]` of ObjectIds - only the input widget
 * changed, not the payload shape.
 *
 * `seoKeywords` DOES have a dedicated field (a comma-separated text input, split
 * to an array only when building the request) - same convention as admin-blog-
 * form's SEO step. There's no seoTitle/seoDescription for a product on the
 * backend (see PUT admin/products/:id/seo's validator), so unlike the blog form
 * this is keywords-only. Saved via Product.updateSeo() as a follow-up call after
 * create/update succeeds, since it's a separate endpoint (see that method's comment).
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
    FormLayout,
    FormSection,
    FormActions,
    FileUpload,
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
  /** Set on the first failed submit attempt - gates the alt-text "obavezno"
   * messages so nothing shows up front on a blank new-product form (same
   * pattern as admin-blog-form's `submitted`). */
  submitted = signal(false);
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
    seoKeywords: [''],
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
      seoKeywords: (product.seoKeywords ?? []).join(', '),
    });
    this.imagePreviewUrl.set(product.image?.img ?? null);
    this.galleryPreview.set(product.gallery ?? []);

    this.longDescription = product.longDescription ?? [];
    this.relatedProducts = product.relatedProducts ?? [];
    this.relatedServices = product.relatedServices ?? [];
    this.relatedPosts = product.relatedPosts ?? [];
    this.faq = product.faq ?? [];

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

  onImageSelected(file: File): void {
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

  onImageRemoved(): void {
    this.form.patchValue({ image: null });
    this.imagePreviewUrl.set(null);
  }

  onCoverAltChanged(value: string): void {
    const cover = this.form.get('image')?.value as ImageReference | null;
    if (!cover) return;
    this.form.patchValue({ image: { ...cover, imgDesc: value } });
  }

  /** ImageSchema.imgDesc is a required Mongoose field - an empty alt text
   * would fail to save even though the image itself uploaded fine. Cover
   * image itself isn't required for a product, so this only blocks submit
   * when a cover image is actually present. */
  coverImageAltSatisfied(): boolean {
    const cover = this.form.get('image')?.value as ImageReference | null;
    return !cover || !!cover.imgDesc?.trim();
  }

  /** Mirrors the backend's required-imgDesc rule for every gallery image. */
  galleryAltSatisfied(): boolean {
    return this.galleryPreview().every((img) => !!img.imgDesc?.trim());
  }

  onGalleryAltChanged(index: number, value: string): void {
    const updated = this.galleryPreview().map((img, i) => (i === index ? { ...img, imgDesc: value } : img));
    this.form.patchValue({ gallery: updated });
    this.galleryPreview.set(updated);
  }

  onGallerySelected(files: File[]): void {
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

  onGalleryImageRemoved(index: number): void {
    const remaining = this.galleryPreview().filter((_, i) => i !== index);
    this.form.patchValue({ gallery: remaining });
    this.galleryPreview.set(remaining);
  }

  submit(): void {
    const altTextOk = this.coverImageAltSatisfied() && this.galleryAltSatisfied();

    if (this.form.invalid || !altTextOk) {
      this.form.markAllAsTouched();
      this.submitted.set(true);
      return;
    }

    // form.value has the form-editable fields; the rest of the payload comes from
    // whatever the loaded edit payload carried (see the header comment). seoKeywords
    // is pulled out separately - it's saved through its own endpoint below, not the
    // create/update payload (same split as admin-blog-form's SEO step).
    const { seoKeywords, ...formValue } = this.form.value;
    const payload: ProductEditPayload = {
      ...formValue,
      longDescription: this.longDescription,
      relatedProducts: this.relatedProducts,
      relatedServices: this.relatedServices,
      relatedPosts: this.relatedPosts,
      faq: this.faq,
    };
    const id = this.productId();

    this.saving.set(true);
    const request$: Observable<ProductEditPayload> = id ? this.product.update(id, payload) : this.product.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        const savedId = id ?? saved.id;
        // SEO is a separate endpoint (see Product.updateSeo()'s comment) - only
        // callable once the product has an id, so it's a follow-up call rather
        // than part of the create/update payload above. Best-effort: a failed
        // SEO save shouldn't make the person think the whole product failed to
        // save, since it plainly did.
        if (savedId) {
          this.product
            .updateSeo(savedId, { seoKeywords: seoKeywords || undefined })
            .subscribe({ error: () => this.snackBar.open('Proizvod je sačuvan, ali SEO podaci nisu uspeli.', 'U redu', { duration: 4000 }) });
        }
        this.snackBar.open('Proizvod je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/prodavnica']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
