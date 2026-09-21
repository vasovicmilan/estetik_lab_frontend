import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Product } from '../../services/product';
import { ProductPublicCard } from '../../models/product';
import { ApiMeta } from '../../../../core/models/api-response';

/** Public list - mounted at /prodavnica (see shop.routes.ts). Same paginated-grid
 * pattern as service-list/package-list. */
@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private product = inject(Product);

  products = signal<ProductPublicCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.product.listPublic({ page }).subscribe({
      next: ({ data, meta }) => {
        this.products.set(data);
        this.meta.set(meta ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.load(event.pageIndex + 1);
  }
}
