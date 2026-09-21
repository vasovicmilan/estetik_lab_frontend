import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlock } from '../../models/post';

/**
 * Renders a post body's structured block array (see ContentBlock in models/post.ts)
 * - one @switch arm per block `tip`, matching renderContentBlocks()'s output
 * (content-blocks.util.js) exactly. Deliberately NOT a single [innerHTML] bind:
 * the backend never sends HTML for a post body, it sends data.
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
