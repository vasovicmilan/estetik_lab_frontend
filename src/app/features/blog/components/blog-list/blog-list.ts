import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PUBLIC_PAGE_SIZES } from '../../../../shared/ui/pagination/page-size';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Post } from '../../services/post';
import { BlogFilters, PostCard } from '../../models/post';
import { ApiMeta } from '../../../../core/models/api-response';
import { BlogFiltersBar } from '../blog-filters-bar/blog-filters-bar';
import { SiteContent } from '../../../../core/services/site-content';
import { ListIntroContent } from '../../../../core/models/site-content';
import { ListIntro } from '../../../../shared/ui/list-intro/list-intro';

/** Selectable page sizes for "broj prikazanih postova" - 9 matches the old
 * EJS site's default (blog.presenter.js/blog.service.js both default to 9,
 * a clean 3x3 grid), the rest are just wider steps around it. Backend clamps
 * whatever comes through to [1, 100] regardless (see pagination.util.js's
 * resolveLimit), so these are purely a frontend UX choice, not a backend limit. */
const PAGE_SIZE_OPTIONS = PUBLIC_PAGE_SIZES;
const DEFAULT_PAGE_SIZE = 9;

@Component({
  selector: 'app-blog-list',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
    BlogFiltersBar,
    ListIntro,
  ],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
})
export class BlogList implements OnInit {
  private post = inject(Post);

  private siteContent = inject(SiteContent);
  /** Intro (eyebrow, H1, lead, highlights) - from the backend (GET /list-intro/blog), same as the EJS site. */
  intro = signal<ListIntroContent | null>(null);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  posts = signal<PostCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  filters = signal<BlogFilters | null>(null);
  loading = signal(true);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  search = signal('');

  ngOnInit(): void {
    this.siteContent.getListIntro('blog').subscribe({ next: (intro) => this.intro.set(intro), error: () => this.intro.set(null) });
    // Filter chrome (category counts, tags) doesn't depend on the current
    // page/search - fetched once, independently, not re-requested on every
    // page flip or search keystroke (see Post.getFilters()'s own comment).
    this.post.getFilters().subscribe({
      next: (filters) => this.filters.set(filters),
      error: () => this.filters.set(null),
    });
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.post.list({ page, limit: this.pageSize(), search: this.search() || undefined }).subscribe({
      next: ({ data, meta }) => {
        this.posts.set(data);
        this.meta.set(meta ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
      this.load(1);
      return;
    }
    this.load(event.pageIndex + 1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.load(1);
  }
}
