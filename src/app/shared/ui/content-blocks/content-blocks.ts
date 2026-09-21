import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../core/pipes/image-url-pipe';
import { ContentBlock } from '../../../core/models/content-block';

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
  imports: [CommonModule, MatChipsModule, ImageUrlPipe],
  templateUrl: './content-blocks.html',
  styleUrl: './content-blocks.scss',
})
export class ContentBlocks {
  blocks = input<ContentBlock[]>([]);
}
