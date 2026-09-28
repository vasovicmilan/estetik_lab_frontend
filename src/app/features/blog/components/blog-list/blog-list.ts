import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Post } from '../../services/post';
import { BlogFilters, PostCard } from '../../models/post';
import { ApiMeta } from '../../../../core/models/api-response';
import { Seo } from '../../../../core/services/seo';
import { BlogFiltersBar } from '../blog-filters-bar/blog-filters-bar';

/** Selectable page sizes for "broj prikazanih postova" - 9 matches the old
 * EJS site's default (blog.presenter.js/blog.service.js both default to 9,
 * a clean 3x3 grid), the rest are just wider steps around it. Backend clamps
 * whatever comes through to [1, 100] regardless (see pagination.util.js's
 * resolveLimit), so these are purely a frontend UX choice, not a backend limit. */
const PAGE_SIZE_OPTIONS = [6, 9, 12, 24];
const DEFAULT_PAGE_SIZE = 9;

@Component({
  selector: 'app-blog-list',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
    BlogFiltersBar,
  ],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
})
export class BlogList implements OnInit {
  private post = inject(Post);
  private seo = inject(Seo);

  /** Static editorial framing for the intro section (no backend content
   * source for this - mirrors how the SEO descriptions for listing pages are
   * hand-written copy, not data from an endpoint). Purely descriptive of the
   * kinds of posts on the blog, not a live category filter. */
  readonly introTopics = [
    { icon: 'spa', title: 'Saveti za negu', text: 'Svakodnevna rutina i praktični saveti za zdravu kožu.' },
    { icon: 'auto_awesome', title: 'Vodiči kroz tretmane', text: 'Šta da očekujete pre, tokom i posle tretmana.' },
    { icon: 'newspaper', title: 'Novosti iz estetike', text: 'Nove metode, tehnologije i trendovi u struci.' },
    { icon: 'chat_bubble', title: 'Iskustva i pitanja', text: 'Odgovori na najčešća pitanja naših klijenata.' },
  ];

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  posts = signal<PostCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  filters = signal<BlogFilters | null>(null);
  loading = signal(true);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  search = signal('');

  ngOnInit(): void {
    this.seo.applyStatic('Blog | Estetik Lab', 'Saveti, novosti i stručni tekstovi o nezi kože i tretmanima sa Estetik Lab bloga.');
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
    this.load(event.pageIndex + 1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.load(1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.load(1);
  }
}
