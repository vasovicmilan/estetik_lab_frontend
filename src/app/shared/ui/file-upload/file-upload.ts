import { Component, ElementRef, ViewChild, booleanAttribute, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../core/pipes/image-url-pipe';
import { ImageReference } from '../../../core/models/upload';

/**
 * Shared Material-styled replacement for the bare `<input type="file">` that used
 * to be copy-pasted (identically) across every admin form with an image field
 * (product/blog/service/team/category/business-partner/site-settings). Purely
 * presentational - it does NOT call any upload service itself, it only emits the
 * picked `File[]` and lets the caller's existing `product.uploadImage(file)`-style
 * call happen exactly as before; this keeps the change low-risk (no service/API
 * changes needed anywhere).
 *
 * Two modes, picked by `multiple`:
 * - Single (`multiple` false, the default) - pass the currently-saved image's raw
 *   backend path (NOT yet resolved to an absolute URL, this component applies
 *   `imageUrl` itself) as `previewUrl`. Shows one preview + a remove (X) button
 *   when a preview exists, else just the picker trigger.
 * - Gallery (`multiple` true) - pass the currently-saved `ImageReference[]` as
 *   `previewImages`. Renders a responsive thumbnail grid, each with its own
 *   remove button, plus an "add more" trigger tile.
 *
 * `removed`/`removedAt` only clear the reference locally (form control state) -
 * same as every caller already did (or rather, didn't - none of the 7 original
 * spots had a remove affordance at all, see the design backlog). Deleting the
 * underlying file from storage, if ever wanted, is a separate backend concern.
 *
 * Usage (single):
 * ```html
 * <app-file-upload
 *   [previewUrl]="imagePreviewUrl()"
 *   [uploading]="uploadingImage()"
 *   label="Otpremi sliku"
 *   (filesSelected)="onImageSelected($event[0])"
 *   (removed)="onImageRemoved()"
 * />
 * ```
 *
 * Usage (gallery):
 * ```html
 * <app-file-upload
 *   multiple
 *   [previewImages]="galleryPreview()"
 *   [uploading]="uploadingGallery()"
 *   label="Dodaj slike"
 *   (filesSelected)="onGallerySelected($event)"
 *   (removedAt)="onGalleryImageRemoved($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-file-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
})
export class FileUpload {
  /** Raw (not-yet-resolved) backend path of the current single image, or null. Ignored when `multiple`. */
  previewUrl = input<string | null>(null);
  /** Currently-saved gallery images. Ignored unless `multiple`. */
  previewImages = input<ImageReference[]>([]);
  multiple = input(false, { transform: booleanAttribute });
  uploading = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  accept = input('image/*');
  /** Trigger button label. Single mode swaps it to "Promeni sliku" once a preview exists. */
  label = input('Otpremi sliku');

  /** Every File the native picker returned in one go (length 1 in single mode). */
  filesSelected = output<File[]>();
  /** Single mode only: the person cleared the current image. */
  removed = output<void>();
  /** Gallery mode only: the person removed the image at this index. */
  removedAt = output<number>();

  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  triggerPicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    // Reset so picking the exact same file again still fires a change event.
    input.value = '';
    if (files.length) this.filesSelected.emit(files);
  }
}
