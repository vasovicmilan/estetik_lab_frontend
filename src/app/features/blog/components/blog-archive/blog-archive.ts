import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
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
import { BlogFiltersBar } from '../blog-filters-bar/blog-filters-bar';

type ArchiveFilterType = 'category' | 'tag';

const PAGE_SIZE_OPTIONS = [6, 9, 12, 24];
const DEFAULT_PAGE_SIZE = 9;

/**
 * Public archive page mounted at /blog/kategorija/:slug and /blog/tag/:slug
 * (see blog.routes.ts) - lists posts filtered by a single category or tag.
 * GET /api/v1/blog/posts already supports both via its `category`/`tag`
 * query params, which it resolves as SLUGS (see catalog.controller.js's
 * listPosts -> categoryService.getCategoryBySlugAndDomain /
 * tagService.getTagBySlugAndDomain), so the route's :slug is passed straight
 * through to Post.list() unchanged.
 *
 * The page heading is still derived from the slug itself (dashes -> spaces,
 * title case) rather than the real category/tag display name - GET
 * /blog/filters (see Post.getFilters()) now DOES carry every category/tag's
 * real name+slug, so this heading could be looked up from there instead, but
 * that means waiting on the filters response before the page title can be
 * set; left as-is since the slug-derived heading already reads fine in
 * practice, and the `<app-blog-filters-bar>` pill row below highlights the
 * REAL name for whichever one is active regardless.
 */
@Component({
  selector: 'app-blog-archive',
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
  templateUrl: './blog-archive.html',
  styleUrl: './blog-archive.scss',
})
export class BlogArchive implements OnInit {
  private post = inject(Post);
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  filterType: ArchiveFilterType = 'category';
  slug = signal('');
  heading = signal('');
  posts = signal<PostCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  filters = signal<BlogFilters | null>(null);
  loading = signal(true);
  pageSize = signal(DEFAULT_PAGE_SIZE);
  search = signal('');

  ngOnInit(): void {
    // Filter chrome doesn't depend on the slug - fetched once, not re-fetched
    // on every category/tag switch below.
    this.post.getFilters().subscribe({
      next: (filters) => this.filters.set(filters),
      error: () => this.filters.set(null),
    });

    // /blog/kategorija/:slug (and /blog/tag/:slug) is ONE route entry that
    // Angular reuses across different :slug values - clicking from one
    // category pill to another navigates within the SAME component instance,
    // it does not destroy/recreate it. Reading route.snapshot once in
    // ngOnInit (the previous bug) only ever captured the FIRST slug: the URL
    // updates on every click (a new navigation did happen) but nothing here
    // ever re-ran, so the page silently kept showing the original category's
    // posts. Subscribing to paramMap (and route.data, in case filterType
    // could ever vary on the same route reuse) reacts to every navigation
    // within this route, not just the first one.
    this.route.paramMap.subscribe((params) => {
      this.filterType = (this.route.snapshot.data['filterType'] as ArchiveFilterType) ?? 'category';
      const slug = params.get('slug');
      if (!slug) {
        this.loading.set(false);
        return;
      }

      this.slug.set(slug);
      // A fresh category/tag is a fresh listing - carrying over a page size
      // is fine, but a leftover search term or "page 3" from the PREVIOUS
      // category would silently scope the new one down or 404 into an empty
      // page, so both reset here rather than only on an explicit search/page
      // interaction.
      this.search.set('');
      const label = this.slugToLabel(slug);
      this.heading.set(label);
      this.titleService.setTitle(`${this.filterType === 'tag' ? 'Tag' : 'Kategorija'}: ${label} | Estetik Lab Blog`);
      this.load(1);
    });
  }

  load(page: number): void {
    this.loading.set(true);
    const base = this.filterType === 'tag' ? { tag: this.slug() } : { category: this.slug() };
    this.post.list({ ...base, page, limit: this.pageSize(), search: this.search() || undefined }).subscribe({
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

  private slugToLabel(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
