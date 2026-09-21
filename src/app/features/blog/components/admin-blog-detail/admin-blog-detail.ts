import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { Post } from '../../services/post';
import { PostAdminDetail } from '../../models/post';

/** Read-only view of GET /admin/posts/:id (Post.getById() -> PostAdminDetail).
 * Mounted at /admin/blog/:id/pregled (see blog.routes.ts). */
@Component({
  selector: 'app-admin-blog-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './admin-blog-detail.html',
  styleUrl: './admin-blog-detail.scss',
})
export class AdminBlogDetail implements OnInit {
  private post = inject(Post);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  postId = signal<string | null>(null);
  detail = signal<PostAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.postId.set(id);
    this.loading.set(true);
    this.post
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju objave.', 'U redu', { duration: 4000 }),
      });
  }

  /** autor.avatar can be an ImageDisplay object or a plain url string (see
   * PostDetail.autor's own comment in models/post.ts) - normalize to a url here
   * so the template doesn't need a typeof check. */
  authorAvatarUrl(): string | null {
    const avatar = this.detail()?.autor.avatar;
    if (!avatar) return null;
    return typeof avatar === 'string' ? avatar : avatar.url;
  }
}
