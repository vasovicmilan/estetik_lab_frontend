import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { PostDetail } from '../../models/post';

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink, MatChipsModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss',
})
export class BlogDetail {
  post = input<PostDetail | null>(null);
}
