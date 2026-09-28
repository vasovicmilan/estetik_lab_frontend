import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BlogFilters } from '../../models/post';

/**
 * Blog "chrome" shared by the plain list (/blog), a category archive
 * (/blog/kategorija/:slug) and a tag archive (/blog/tag/:slug) - a debounced
 * search box, the "Sve objave (N)"/category pill row with live post counts,
 * and the tag chip row. Mirrors the old EJS site's blog.presenter.js
 * (buildCategoryTabs/buildTagChips) now that GET /blog/filters exposes the
 * same category-post-count data those functions consumed.
 *
 * Deliberately plain <a routerLink> pills instead of <mat-chip> for the tabs/
 * tags (not <mat-chip-set>): a real link needs to stay a real, crawlable,
 * ctrl-clickable anchor, and nesting an interactive mat-chip inside/around an
 * <a> creates a focusable-in-focusable a11y tangle for no visual benefit -
 * these are styled to look like pills via plain CSS instead.
 */
@Component({
  selector: 'app-blog-filters-bar',
  imports: [CommonModule, RouterLink, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './blog-filters-bar.html',
  styleUrl: './blog-filters-bar.scss',
})
export class BlogFiltersBar implements OnDestroy {
  @Input() filters: BlogFilters | null = null;
  @Input() activeCategorySlug: string | null = null;
  @Input() activeTagSlug: string | null = null;
  @Input() search = '';
  @Output() searchChange = new EventEmitter<string>();

  private searchTimeout?: ReturnType<typeof setTimeout>;

  onSearchInput(value: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.searchChange.emit(value.trim()), 400);
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);
  }
}
