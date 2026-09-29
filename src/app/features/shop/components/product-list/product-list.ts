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
import { Product } from '../../services/product';
import { ProductPublicCard } from '../../models/product';
import { ApiMeta } from '../../../../core/models/api-response';
import { SiteContent } from '../../../../core/services/site-content';
import { ListIntroContent } from '../../../../core/models/site-content';
import { ListIntro } from '../../../../shared/ui/list-intro/list-intro';

/** Public list - mounted at /prodavnica (see shop.routes.ts). Same paginated-grid
 * pattern as service-list/package-list. */
@Component({
  selector: 'app-product-list',
  imports: [ListIntro, CommonModule, RouterLink, MatCardModule, MatChipsModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private siteContent = inject(SiteContent);
  intro = signal<ListIntroContent | null>(null);
  private product = inject(Product);

  products = signal<ProductPublicCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(true);
  readonly pageSizeOptions = PUBLIC_PAGE_SIZES;
  pageSize = signal(12);

  ngOnInit(): void {
    this.siteContent.getListIntro('products').subscribe({ next: (intro) => this.intro.set(intro), error: () => this.intro.set(null) });
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.product.listPublic({ page, limit: this.pageSize() }).subscribe({
      next: ({ data, meta }) => {
        this.products.set(data);
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
}
