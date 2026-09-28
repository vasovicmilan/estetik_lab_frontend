import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, Observable, of } from 'rxjs';
import { ImageReference } from '../../../../core/models/upload';
import {
  CONTENT_BLOCK_TYPE_OPTIONS,
  ContentBlock,
  ContentBlockCard,
  ContentBlockFaqItem,
  createEmptyContentBlock,
  mapApiBlockToContentBlock,
  mapContentBlockToApiBlock,
} from '../../../../core/models/content-block';
import { Post } from '../../services/post';
import { PostEditPayload } from '../../models/post';
import { Category } from '../../../taxonomy/services/category';
import { Tag } from '../../../taxonomy/services/tag';
import { CategoryAdminListItem } from '../../../taxonomy/models/category';
import { TagAdminListItem } from '../../../taxonomy/models/tag';
import { User } from '../../../users/services/user';
import { UserAdminListItem } from '../../../users/models/user';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FileUpload } from '../../../../shared/ui/file-upload/file-upload';

/** Only `http(s):`, `mailto:`, `tel:`, or a root-relative path (`/...`, not
 * `//host` which is protocol-relative) are accepted for a content block's
 * `button.url`/`video.url` - mirrors the backend's own URL-safety check
 * (rejects `javascript:`, `data:`, bare relative paths, `//host`) so bad
 * input is caught here instead of round-tripping to a 400. */
const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

/**
 * Create + edit, same pattern as admin-service-form/admin-product-form: loads the
 * edit shape (GET /admin/posts/:id - see services/post.ts's getForEdit() comment
 * for why there's no separate /edit route here) when an id is present in the
 * route, otherwise starts blank for a new post.
 *
 * Rebuilt as a `mat-stepper` (see admin-coupon-form for the reference pattern
 * this follows) with one nested FormGroup per step - `basic` / `taxonomy` /
 * `images` / `seo` - plus a `content` step that isn't backed by a FormGroup at
 * all: the block editor works on a plain `contentBlocks` signal (add/remove/
 * reorder/edit-in-place), same "signal instead of a form control" precedent
 * this file already used for `galleryPreview`/`imagePreviewUrl`, since the 15
 * block-type shapes don't map cleanly onto per-field Validators and the
 * backend places no required/min-length constraint on the array itself (only
 * the URL-safety check above, enforced manually before submit).
 *
 * `author`: GET /admin/users needs `manage_users`, which the logged-in admin
 * may not have - `userPickerAvailable` tracks that and the template falls
 * back to a read-only "Autor: <ime ili ID>" line instead of breaking the step
 * (see ngOnInit's catchError).
 *
 * Categories/tags are the first `mat-chip-grid` + `mat-autocomplete`
 * multi-selects in this codebase (replacing the old `mat-select multiple`) -
 * typeahead-filtered, Enter/click-to-add as a chip, remove icon per chip.
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
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    FormLayout,
    FormSection,
    FormActions,
    FileUpload,
  ],
  templateUrl: './admin-blog-form.html',
  styleUrl: './admin-blog-form.scss',
})
export class AdminBlogForm implements OnInit {
  private fb = inject(FormBuilder);
  private post = inject(Post);
  private category = inject(Category);
  private tag = inject(Tag);
  private user = inject(User);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  postId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  /** Set on the first failed submit/step-advance attempt - gates every
   * "obavezno" message so nothing shows up front on a blank new-post form
   * before the person has done anything. */
  submitted = signal(false);
  uploadingImage = signal(false);
  uploadingGallery = signal(false);
  imagePreviewUrl = signal<string | null>(null);
  galleryPreview = signal<ImageReference[]>([]);
  categoryOptions = signal<CategoryAdminListItem[]>([]);
  tagOptions = signal<TagAdminListItem[]>([]);
  userOptions = signal<UserAdminListItem[]>([]);
  /** false once GET admin/users 403s (missing manage_users) - see class doc. */
  authorPickerAvailable = signal(true);

  /** Same breakpoint DataTable/admin-coupon-form already established. */
  private isHandset = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  stepperOrientation = () => (this.isHandset() ? 'vertical' : 'horizontal');

  statusOptions = [
    { value: 'draft', label: 'Nacrt' },
    { value: 'scheduled', label: 'Zakazano' },
    { value: 'published', label: 'Objavljeno' },
    { value: 'archived', label: 'Arhivirano' },
  ];

  blockTypeOptions = CONTENT_BLOCK_TYPE_OPTIONS;
  newBlockType = new FormControl<string>('paragraph', { nonNullable: true });

  /** The block editor's working data - see class doc for why this is a signal,
   * not a form control. */
  contentBlocks = signal<ContentBlock[]>([]);

  // Plain (non-form-group) filter-text controls for the chip-grid autocompletes -
  // deliberately separate from the `categories`/`tags` array controls they add to.
  categorySearch = new FormControl<string>('', { nonNullable: true });
  tagSearch = new FormControl<string>('', { nonNullable: true });

  form: FormGroup = this.fb.group({
    basic: this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
      // Backend caps excerpt at 300, not 500 - see PostEditPayload.excerpt's comment.
      excerpt: ['', [Validators.required, Validators.maxLength(300)]],
      status: ['draft', Validators.required],
      scheduledFor: [''],
      isIndexable: [true],
      isFeatured: [false],
      featuredOrder: [null as number | null],
    }),
    taxonomy: this.fb.group({
      categories: [[] as string[]],
      tags: [[] as string[]],
      author: [null as string | null],
    }),
    images: this.fb.group({
      coverImage: [null as ImageReference | null],
      gallery: [[] as ImageReference[]],
    }),
    // The content step has no form group of its own (see contentBlocks above) -
    // this one is a placeholder purely so `mat-stepper` has a `stepControl` to
    // bind (it's always valid; URL-safety is checked manually on submit).
    content: this.fb.group({}),
    seo: this.fb.group({
      seoTitle: ['', Validators.maxLength(70)],
      seoDescription: ['', Validators.maxLength(160)],
      seoKeywords: [''],
    }),
  });

  get basicGroup(): FormGroup {
    return this.form.get('basic') as FormGroup;
  }
  get taxonomyGroup(): FormGroup {
    return this.form.get('taxonomy') as FormGroup;
  }
  get imagesGroup(): FormGroup {
    return this.form.get('images') as FormGroup;
  }
  get contentGroup(): FormGroup {
    return this.form.get('content') as FormGroup;
  }
  get seoGroup(): FormGroup {
    return this.form.get('seo') as FormGroup;
  }

  constructor() {
    this.basicGroup.get('status')?.valueChanges.subscribe(() => {
      this.basicGroup.get('scheduledFor')?.updateValueAndValidity();
    });
    this.basicGroup.setValidators(() => this.validateScheduledFor());
    // Cover image + its alt text + every gallery image's alt text live as
    // signals, not form controls (see coverImageSatisfied()'s comment) - this
    // group-level validator is what makes the "Slike" step's [stepControl]
    // actually block `matStepperNext` on them, same as any other step.
    this.imagesGroup.setValidators(() => this.validateImages());
  }

  private validateImages(): ValidationErrors | null {
    if (!this.coverImageSatisfied() || !this.coverImageAltSatisfied() || !this.galleryAltSatisfied()) {
      return { imagesInvalid: true };
    }
    return null;
  }

  private validateScheduledFor(): ValidationErrors | null {
    const status = this.basicGroup?.get('status')?.value;
    const scheduledFor = this.basicGroup?.get('scheduledFor')?.value;
    if (status === 'scheduled' && !scheduledFor) {
      return { scheduledForRequired: true };
    }
    return null;
  }

  get isScheduled(): boolean {
    return this.basicGroup.get('status')?.value === 'scheduled';
  }

  get isFeatured(): boolean {
    return this.basicGroup.get('isFeatured')?.value === true;
  }

  /** Bound to each step's Next button - `matStepperNext` already blocks
   * advancing while the step's `stepControl` is invalid (linear mode), but it
   * doesn't itself surface *why* by marking controls touched. */
  revealErrors(group: FormGroup): void {
    group.markAllAsTouched();
    this.submitted.set(true);
  }

  // ---- Cover image (+ required alt text) ----

  /** Cover image is required at the DB level for both create and update (see
   * postService's validateBasicData). An existing cover on edit already
   * satisfies this unless explicitly cleared. */
  coverImageSatisfied(): boolean {
    return !!this.imagesGroup.get('coverImage')?.value;
  }

  /** ImageSchema.imgDesc is a required Mongoose field - an empty alt text
   * would fail to save even though the image itself uploaded fine. */
  coverImageAltSatisfied(): boolean {
    const cover = this.imagesGroup.get('coverImage')?.value as ImageReference | null;
    return !cover || !!cover.imgDesc?.trim();
  }

  onImageSelected(file: File): void {
    this.uploadingImage.set(true);
    this.post
      .uploadImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.imagesGroup.patchValue({ coverImage: reference });
          this.imagePreviewUrl.set(reference.img);
        },
        error: () => this.snackBar.open('Upload slike nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  onImageRemoved(): void {
    this.imagesGroup.patchValue({ coverImage: null });
    this.imagePreviewUrl.set(null);
  }

  onCoverAltChanged(value: string): void {
    const cover = this.imagesGroup.get('coverImage')?.value as ImageReference | null;
    if (!cover) return;
    this.imagesGroup.patchValue({ coverImage: { ...cover, imgDesc: value } });
  }

  // ---- Gallery (+ required alt text per image, 10-image cap) ----

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
    this.post
      .uploadGallery(toUpload)
      .pipe(finalize(() => this.uploadingGallery.set(false)))
      .subscribe({
        next: (references) => {
          const merged = [...this.galleryPreview(), ...references];
          this.imagesGroup.patchValue({ gallery: merged });
          this.galleryPreview.set(merged);
        },
        error: () => this.snackBar.open('Upload galerije nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  onGalleryImageRemoved(index: number): void {
    const remaining = this.galleryPreview().filter((_, i) => i !== index);
    this.imagesGroup.patchValue({ gallery: remaining });
    this.galleryPreview.set(remaining);
  }

  onGalleryAltChanged(index: number, value: string): void {
    const updated = this.galleryPreview().map((img, i) => (i === index ? { ...img, imgDesc: value } : img));
    this.imagesGroup.patchValue({ gallery: updated });
    this.galleryPreview.set(updated);
  }

  // ---- Categories / tags chip-grid + autocomplete ----

  filteredCategoryOptions = computed(() => {
    const selected = new Set<string>(this.taxonomyGroup.get('categories')?.value ?? []);
    const query = (this.categorySearch.value ?? '').trim().toLowerCase();
    return this.categoryOptions()
      .filter((option) => !selected.has(option.id))
      .filter((option) => !query || option.naziv.toLowerCase().includes(query));
  });

  filteredTagOptions = computed(() => {
    const selected = new Set<string>(this.taxonomyGroup.get('tags')?.value ?? []);
    const query = (this.tagSearch.value ?? '').trim().toLowerCase();
    return this.tagOptions()
      .filter((option) => !selected.has(option.id))
      .filter((option) => !query || option.naziv.toLowerCase().includes(query));
  });

  categoryName(id: string): string {
    return this.categoryOptions().find((option) => option.id === id)?.naziv ?? id;
  }

  tagName(id: string): string {
    return this.tagOptions().find((option) => option.id === id)?.naziv ?? id;
  }

  addCategory(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    const current: string[] = this.taxonomyGroup.get('categories')?.value ?? [];
    if (!current.includes(id)) this.taxonomyGroup.patchValue({ categories: [...current, id] });
    this.categorySearch.setValue('');
    event.option.deselect();
  }

  removeCategory(id: string): void {
    const current: string[] = this.taxonomyGroup.get('categories')?.value ?? [];
    this.taxonomyGroup.patchValue({ categories: current.filter((c) => c !== id) });
  }

  addTag(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    const current: string[] = this.taxonomyGroup.get('tags')?.value ?? [];
    if (!current.includes(id)) this.taxonomyGroup.patchValue({ tags: [...current, id] });
    this.tagSearch.setValue('');
    event.option.deselect();
  }

  removeTag(id: string): void {
    const current: string[] = this.taxonomyGroup.get('tags')?.value ?? [];
    this.taxonomyGroup.patchValue({ tags: current.filter((t) => t !== id) });
  }

  /** Free-typed chip input (Enter with no autocomplete option highlighted) is
   * ignored on purpose - categories/tags are a closed picklist, not
   * free-text, unlike a typical chip-input use case. */
  onChipInputEvent(event: MatChipInputEvent): void {
    event.chipInput.clear();
  }

  authorDisplayLabel(): string {
    const id = this.taxonomyGroup.get('author')?.value as string | null;
    if (!id) return 'Nepoznat';
    return this.userOptions().find((u) => u.id === id)?.imePrezime ?? id;
  }

  // ---- Content block editor ----

  addBlock(): void {
    const block = createEmptyContentBlock(this.newBlockType.value);
    this.contentBlocks.set([...this.contentBlocks(), block]);
  }

  removeBlock(index: number): void {
    this.contentBlocks.set(this.contentBlocks().filter((_, i) => i !== index));
  }

  moveBlockUp(index: number): void {
    if (index <= 0) return;
    const blocks = [...this.contentBlocks()];
    [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
    this.contentBlocks.set(blocks);
  }

  moveBlockDown(index: number): void {
    const blocks = [...this.contentBlocks()];
    if (index >= blocks.length - 1) return;
    [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    this.contentBlocks.set(blocks);
  }

  blockLabel(tip: string): string {
    return this.blockTypeOptions.find((option) => option.value === tip)?.label ?? tip;
  }

  updateBlock(index: number, patch: Partial<ContentBlock>): void {
    const blocks = [...this.contentBlocks()];
    blocks[index] = { ...blocks[index], ...patch };
    this.contentBlocks.set(blocks);
  }

  /** Only `http(s):`/`mailto:`/`tel:`/root-relative URLs pass - see
   * SAFE_URL_PATTERN's comment. Empty is fine everywhere (the field is optional). */
  isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return true;
    return SAFE_URL_PATTERN.test(url);
  }

  /** True once every button.url/video.url across every block is either empty
   * or passes isSafeUrl() - checked before allowing submit. */
  contentUrlsSafe(): boolean {
    return this.contentBlocks().every((block) => this.isSafeUrl(block.dugme?.url) && this.isSafeUrl(block.video?.url));
  }

  // -- image block (single ImageSchema-shaped image, uploaded via post.uploadImage) --

  onBlockImageSelected(index: number, file: File): void {
    this.post.uploadImage(file).subscribe({
      next: (reference) => this.updateBlock(index, { slika: { url: reference.img, alt: '' } }),
      error: () => this.snackBar.open('Upload slike nije uspeo.', 'U redu', { duration: 4000 }),
    });
  }

  onBlockImageRemoved(index: number): void {
    this.updateBlock(index, { slika: { url: null, alt: '' } });
  }

  onBlockImageAltChanged(index: number, value: string): void {
    const block = this.contentBlocks()[index];
    this.updateBlock(index, { slika: { url: block.slika?.url ?? null, alt: value } });
  }

  // -- gallery block (ContentBlockImage[], uploaded via post.uploadGallery) --

  /** Adapts a block's ContentBlockImage[] (`{url, alt}`) to the shape
   * app-file-upload's `previewImages` expects (`{img, ...}`) purely for
   * display - it only ever reads `.img` off these. */
  blockGalleryPreview(index: number): ImageReference[] {
    return (this.contentBlocks()[index].galerija ?? []).map((img) => ({
      img: img.url ?? '',
      imgThumb: null,
      imgMedium: null,
      imgOriginal: null,
      imgDesc: img.alt ?? '',
    }));
  }

  onBlockGallerySelected(index: number, files: File[]): void {
    if (!files.length) return;
    this.post.uploadGallery(files).subscribe({
      next: (references) => {
        const existing = this.contentBlocks()[index].galerija ?? [];
        const added = references.map((r) => ({ url: r.img, alt: r.imgDesc || '' }));
        this.updateBlock(index, { galerija: [...existing, ...added] });
      },
      error: () => this.snackBar.open('Upload galerije nije uspeo.', 'U redu', { duration: 4000 }),
    });
  }

  onBlockGalleryImageRemoved(index: number, imageIndex: number): void {
    const existing = this.contentBlocks()[index].galerija ?? [];
    this.updateBlock(index, { galerija: existing.filter((_, i) => i !== imageIndex) });
  }

  onBlockGalleryAltChanged(index: number, imageIndex: number, value: string): void {
    const existing = this.contentBlocks()[index].galerija ?? [];
    this.updateBlock(index, { galerija: existing.map((img, i) => (i === imageIndex ? { ...img, alt: value } : img)) });
  }

  // -- list block --

  addListItem(index: number): void {
    const items = this.contentBlocks()[index].stavke ?? [];
    this.updateBlock(index, { stavke: [...items, ''] });
  }

  updateListItem(index: number, itemIndex: number, value: string): void {
    const items = [...(this.contentBlocks()[index].stavke ?? [])];
    items[itemIndex] = value;
    this.updateBlock(index, { stavke: items });
  }

  removeListItem(index: number, itemIndex: number): void {
    const items = (this.contentBlocks()[index].stavke ?? []).filter((_, i) => i !== itemIndex);
    this.updateBlock(index, { stavke: items });
  }

  // -- table block --

  addTableColumn(index: number): void {
    const columns = this.contentBlocks()[index].kolone ?? [];
    this.updateBlock(index, { kolone: [...columns, ''] });
  }

  updateTableColumn(index: number, columnIndex: number, value: string): void {
    const columns = [...(this.contentBlocks()[index].kolone ?? [])];
    columns[columnIndex] = value;
    this.updateBlock(index, { kolone: columns });
  }

  removeTableColumn(index: number, columnIndex: number): void {
    const columns = (this.contentBlocks()[index].kolone ?? []).filter((_, i) => i !== columnIndex);
    this.updateBlock(index, { kolone: columns });
  }

  addTableRow(index: number): void {
    const rows = this.contentBlocks()[index].redovi ?? [];
    this.updateBlock(index, { redovi: [...rows, { label: '', values: [] }] });
  }

  updateTableRowLabel(index: number, rowIndex: number, value: string): void {
    const rows = [...(this.contentBlocks()[index].redovi ?? [])];
    rows[rowIndex] = { ...rows[rowIndex], label: value };
    this.updateBlock(index, { redovi: rows });
  }

  updateTableRowValue(index: number, rowIndex: number, valueIndex: number, value: string): void {
    const rows = [...(this.contentBlocks()[index].redovi ?? [])];
    const values = [...(rows[rowIndex].values ?? [])];
    values[valueIndex] = value;
    rows[rowIndex] = { ...rows[rowIndex], values };
    this.updateBlock(index, { redovi: rows });
  }

  removeTableRow(index: number, rowIndex: number): void {
    const rows = (this.contentBlocks()[index].redovi ?? []).filter((_, i) => i !== rowIndex);
    this.updateBlock(index, { redovi: rows });
  }

  // -- cards block --

  addCard(index: number): void {
    const cards = this.contentBlocks()[index].kartice ?? [];
    this.updateBlock(index, { kartice: [...cards, { icon: '', title: '', text: '' }] });
  }

  updateCard(index: number, cardIndex: number, patch: Partial<ContentBlockCard>): void {
    const cards = [...(this.contentBlocks()[index].kartice ?? [])];
    cards[cardIndex] = { ...cards[cardIndex], ...patch };
    this.updateBlock(index, { kartice: cards });
  }

  removeCard(index: number, cardIndex: number): void {
    const cards = (this.contentBlocks()[index].kartice ?? []).filter((_, i) => i !== cardIndex);
    this.updateBlock(index, { kartice: cards });
  }

  // -- faq block --

  addFaqItem(index: number): void {
    const items = this.contentBlocks()[index].faqStavke ?? [];
    this.updateBlock(index, { faqStavke: [...items, { question: '', answer: '', order: items.length }] });
  }

  updateFaqItem(index: number, itemIndex: number, patch: Partial<ContentBlockFaqItem>): void {
    const items = [...(this.contentBlocks()[index].faqStavke ?? [])];
    items[itemIndex] = { ...items[itemIndex], ...patch };
    this.updateBlock(index, { faqStavke: items });
  }

  removeFaqItem(index: number, itemIndex: number): void {
    const items = (this.contentBlocks()[index].faqStavke ?? [])
      .filter((_, i) => i !== itemIndex)
      .map((item, i) => ({ ...item, order: i }));
    this.updateBlock(index, { faqStavke: items });
  }

  ngOnInit(): void {
    // Categories/tags/authors are loaded together, and the edit fetch below is
    // only started once all three have settled - in particular, the author
    // mat-select needs `userOptions()` populated BEFORE `patchForm()` sets the
    // `author` control's value, or the select has no matching mat-option to
    // show as selected yet (see class doc's authorPickerAvailable note - this
    // was the actual cause of the author picker showing empty on edit).
    forkJoin({
      categories: this.category.listAdmin({ domain: 'post', limit: 200 }).pipe(
        map(({ data }) => data),
        catchError(() => of([] as CategoryAdminListItem[])),
      ),
      tags: this.tag.listAdmin({ domain: 'post', limit: 200 }).pipe(
        map(({ data }) => data),
        catchError(() => of([] as TagAdminListItem[])),
      ),
      users: this.user.listAdmin({ limit: 200 }).pipe(
        map(({ data }) => data),
        // 403 without manage_users - fall back to a read-only author label
        // instead of breaking the step (see class doc + authorDisplayLabel()).
        catchError(() => {
          this.authorPickerAvailable.set(false);
          return of([] as UserAdminListItem[]);
        }),
      ),
    }).subscribe(({ categories, tags, users }) => {
      this.categoryOptions.set(categories);
      this.tagOptions.set(tags);
      this.userOptions.set(users);

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
    });
  }

  private patchForm(post: PostEditPayload): void {
    this.basicGroup.patchValue({
      title: post.title,
      slug: post.slug ?? '',
      excerpt: post.excerpt,
      status: post.status ?? 'draft',
      scheduledFor: post.scheduledFor ?? '',
      isIndexable: post.isIndexable ?? true,
      isFeatured: post.isFeatured ?? false,
      featuredOrder: post.featuredOrder ?? null,
    });
    this.taxonomyGroup.patchValue({
      categories: post.categories ?? [],
      tags: post.tags ?? [],
      author: post.author ?? null,
    });
    this.imagesGroup.patchValue({
      coverImage: post.coverImage ?? null,
      gallery: post.gallery ?? [],
    });
    this.imagePreviewUrl.set(post.coverImage?.img ?? null);
    this.galleryPreview.set(post.gallery ?? []);

    // post.content is the raw wire shape (English field names, e.g. `type`/
    // `text`) - NOT the ContentBlock (Serbian) shape the block editor below
    // works with, so it has to go through mapApiBlockToContentBlock first.
    // Feeding it in unconverted left every loaded block with `tip: undefined`,
    // which matched no `@switch` case and rendered as a blank card.
    this.contentBlocks.set((post.content ?? []).map(mapApiBlockToContentBlock));

    this.seoGroup.patchValue({
      seoTitle: post.seo?.title ?? '',
      seoDescription: post.seo?.description ?? '',
      seoKeywords: (post.seo?.keywords ?? []).join(', '),
    });
  }

  submit(): void {
    const requiredFieldsOk =
      this.coverImageSatisfied() && this.coverImageAltSatisfied() && this.galleryAltSatisfied() && this.contentUrlsSafe();

    if (this.form.invalid || !requiredFieldsOk) {
      this.form.markAllAsTouched();
      this.submitted.set(true);
      if (!this.contentUrlsSafe()) {
        this.snackBar.open('Neki linkovi u sadržaju nisu bezbedni (dozvoljeno: http(s), mailto, tel ili /putanja).', 'U redu', {
          duration: 5000,
        });
      }
      return;
    }

    const basic = this.basicGroup.value;
    const taxonomy = this.taxonomyGroup.value;
    const images = this.imagesGroup.value;
    const seo = this.seoGroup.value;

    // Convert back to the wire shape (English field names) the backend
    // actually expects - see PostEditPayload.content's comment. `order` is set
    // per block from its position in the array, same convention as
    // faqItems' own per-item order (handled inside mapContentBlockToApiBlock).
    const content = this.contentBlocks().map((block, i) => mapContentBlockToApiBlock(block, i));

    const payload: PostEditPayload = {
      title: basic.title,
      slug: basic.slug || undefined,
      excerpt: basic.excerpt,
      content,
      coverImage: images.coverImage,
      gallery: images.gallery,
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      author: this.authorPickerAvailable() ? taxonomy.author || undefined : undefined,
      status: basic.status,
      scheduledFor: basic.status === 'scheduled' ? basic.scheduledFor : undefined,
      isIndexable: basic.isIndexable,
      isFeatured: basic.isFeatured,
      featuredOrder: basic.isFeatured ? basic.featuredOrder : null,
    };
    const id = this.postId();

    this.saving.set(true);
    const request$: Observable<PostEditPayload> = id ? this.post.update(id, payload) : this.post.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        const savedId = id ?? saved.id;
        // SEO is a separate endpoint (see Post.updateSeo()'s comment) - only
        // callable once the post has an id, so it's a follow-up call rather
        // than part of the create/update payload above. Best-effort: a failed
        // SEO save shouldn't make the person think the whole post failed to
        // save, since it plainly did.
        if (savedId) {
          this.post
            .updateSeo(savedId, {
              seoTitle: seo.seoTitle || undefined,
              seoDescription: seo.seoDescription || undefined,
              seoKeywords: seo.seoKeywords || undefined,
            })
            .subscribe({ error: () => this.snackBar.open('Objava je sačuvana, ali SEO podaci nisu uspeli.', 'U redu', { duration: 4000 }) });
        }
        this.snackBar.open('Objava je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/blog']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 5000 }),
    });
  }
}
