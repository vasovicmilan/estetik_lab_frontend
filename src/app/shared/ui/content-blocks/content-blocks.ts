import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ImageUrlPipe } from '../../../core/pipes/image-url-pipe';
import { ContentBlock } from '../../../core/models/content-block';
import { slugify } from '../../../core/utils/slugify';

/** Icon shown per callout variant - matches ContentBlockCallout['varijanta']
 * ('info'|'success'|'warning'|'danger') in core/models/content-block.ts. */
const CALLOUT_ICONS: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
};

/**
 * Renders a structured content-block array (see ContentBlock in
 * core/models/content-block.ts) - one @switch arm per block `tip`, matching
 * renderContentBlocks()'s output (content-blocks.util.js) exactly. Deliberately
 * NOT a single [innerHTML] bind: the backend never sends HTML for a post/product
 * body, it sends data. Shared between blog (PostDetail.sadrzaj) and shop
 * (ProductPublicDetail.dugiOpis) - lives under shared/ui, not either feature.
 */
@Component({
  selector: 'app-content-blocks',
  imports: [CommonModule, MatChipsModule, MatExpansionModule, MatIconModule, ImageUrlPipe],
  templateUrl: './content-blocks.html',
  styleUrl: './content-blocks.scss',
})
export class ContentBlocks {
  blocks = input<ContentBlock[]>([]);

  calloutIcon(variant: string | undefined): string {
    return CALLOUT_ICONS[variant || 'info'] || 'info';
  }

  /** Anchor id for a heading block, keyed by its position in the block array
   * so a TOC (see blog-detail's buildToc) can link straight to it. Suffixing
   * with the index (rather than just slugify(text)) keeps ids unique even
   * when two headings share the same text. */
  headingId(index: number): string {
    const block = this.blocks()[index];
    return `${slugify(block?.tekst || 'sekcija')}-${index}`;
  }
}
