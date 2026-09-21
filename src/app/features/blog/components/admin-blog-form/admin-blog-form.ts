import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { ContentBlock } from '../../../../core/models/content-block';
import { Post } from '../../services/post';
import { PostEditPayload, PostSeo } from '../../models/post';
import { Category } from '../../../taxonomy/services/category';
import { Tag } from '../../../taxonomy/services/tag';
import { CategoryAdminListItem } from '../../../taxonomy/models/category';
import { TagAdminListItem } from '../../../taxonomy/models/tag';

/**
 * Create + edit, same pattern as admin-service-form/admin-product-form: loads the
 * edit shape (GET /admin/posts/:id - see services/post.ts's getForEdit() comment
 * for why there's no separate /edit route here) when an id is present in the
 * route, otherwise starts blank for a new post.
 *
 * Deliberate simplifications for this pass (same precedent as admin-product-form
 * for Product's longDescription):
 * - `content` is content-blocks data, not a plain string - no block editor is
 *   built here. The loaded value is kept in a component field (not a form
 *   control) and merged back into the payload unchanged on submit.
 * - `author` is intentionally left off the form entirely - the backend defaults
 *   it to the logged-in admin when omitted (see PostEditPayload's comment).
 * - `seo` has no dedicated UI, same precedent as Service/Package/Product forms.
 * - The status-only PUT /admin/posts/:id/status endpoint is NOT used separately;
 *   status + scheduledFor are folded into the regular PUT body, which
 *   validatePostUpdate also accepts (per the spec's note on that endpoint).
 *
 * `categories`/`tags` USED to be plain comma-separated ObjectId text fields (an
 * explicit v1 limitation, per this file's earlier comment) - now that Category/Tag
 * have a real listAdmin endpoint (see features/taxonomy), they're proper
 * `mat-select multiple` pickers instead, filtered to domain: 'post'. The
 * FormControls carry plain `string[]` of ObjectIds directly, same shape the
 * backend already expects.
 */
@Component({
  selector: 'app-admin-blog-form',
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
  templateUrl: './admin-blog-form.html',
  styleUrl: './admin-blog-form.scss',
})
export class AdminBlogForm implements OnInit {
  private fb = inject(FormBuilder);
  private post = inject(Post);
  private category = inject(Category);
  private tag = inject(Tag);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  postId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);
  categoryOptions = signal<CategoryAdminListItem[]>([]);
  tagOptions = signal<TagAdminListItem[]>([]);

  statusOptions = [
    { value: 'draft', label: 'Nacrt' },
    { value: 'scheduled', label: 'Zakazano' },
    { value: 'published', label: 'Objavljeno' },
    { value: 'archived', label: 'Arhivirano' },
  ];

  // Preserved unchanged from the loaded edit payload and merged back into the
  // submit payload as-is (see header comment) - no UI in this pass.
  private content: ContentBlock[] = [];
  private seo: PostSeo = {};

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    slug: [''],
    excerpt: ['', [Validators.required, Validators.maxLength(500)]],
    status: ['draft', Validators.required],
    scheduledFor: [''],
    categories: [[] as string[]],
    tags: [[] as string[]],
    isIndexable: [true],
    isFeatured: [false],
    featuredOrder: [null as number | null],
    coverImage: [null as ImageReference | null],
    gallery: [[] as ImageReference[]],
  });

  constructor() {
    this.form.get('status')?.valueChanges.subscribe(() => {
      this.form.get('scheduledFor')?.updateValueAndValidity();
    });
    this.form.setValidators(() => this.validateScheduledFor());
  }

  private validateScheduledFor(): ValidationErrors | null {
    const status = this.form?.get('status')?.value;
    const scheduledFor = this.form?.get('scheduledFor')?.value;
    if (status === 'scheduled' && !scheduledFor) {
      return { scheduledForRequired: true };
    }
    return null;
  }

  get isScheduled(): boolean {
    return this.form.get('status')?.value === 'scheduled';
  }

  get isFeatured(): boolean {
    return this.form.get('isFeatured')?.value === true;
  }

  /** Cover image is required at the DB level for both create and update (see
   * postService's validateBasicData). An existing cover on edit already
   * satisfies this unless explicitly cleared. */
  coverImageSatisfied(): boolean {
    return !!this.form.get('coverImage')?.value;
  }

  ngOnInit(): void {
    this.category.listAdmin({ domain: 'post', limit: 200 }).subscribe({
      next: ({ data }) => this.categoryOptions.set(data),
      error: () => this.categoryOptions.set([]),
    });
    this.tag.listAdmin({ domain: 'post', limit: 200 }).subscribe({
      next: ({ data }) => this.tagOptions.set(data),
      error: () => this.tagOptions.set([]),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.postId.set(id);
    this.loading.set(true);
    this.post
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (post) => this.patchForm(post),
        error: () => this.snackBar.open('Greška pri učitavanju objave.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(post: PostEditPayload): void {
    this.form.patchValue({
      title: post.title,
      slug: post.slug ?? '',
      excerpt: post.excerpt,
      status: post.status ?? 'draft',
      scheduledFor: post.scheduledFor ?? '',
      categories: post.categories ?? [],
      tags: post.tags ?? [],
      isIndexable: post.isIndexable ?? true,
      isFeatured: post.isFeatured ?? false,
      featuredOrder: post.featuredOrder ?? null,
      coverImage: post.coverImage ?? null,
      gallery: post.gallery ?? [],
    });
    this.imagePreviewUrl.set(post.coverImage?.img ?? null);
    this.galleryPreview.set(post.gallery ?? []);

    this.content = post.content ?? [];
    this.seo = post.seo ?? {};
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.post
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

  onGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    this.uploadingGallery.set(true);
    this.post
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
    if (this.form.invalid || !this.coverImageSatisfied()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: PostEditPayload = {
      title: raw.title,
      slug: raw.slug || undefined,
      excerpt: raw.excerpt,
      content: this.content,
      coverImage: raw.coverImage,
      gallery: raw.gallery,
      categories: raw.categories,
      tags: raw.tags,
      status: raw.status,
      scheduledFor: raw.status === 'scheduled' ? raw.scheduledFor : undefined,
      seo: this.seo,
      isIndexable: raw.isIndexable,
      isFeatured: raw.isFeatured,
      featuredOrder: raw.isFeatured ? raw.featuredOrder : null,
    };
    const id = this.postId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.post.update(id, payload) : this.post.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Objava je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/blog']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
