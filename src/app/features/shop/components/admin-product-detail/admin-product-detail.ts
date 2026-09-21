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
import { Product } from '../../services/product';
import { ProductAdminDetail } from '../../models/product';

/** Read-only view of GET /admin/products/:id (Product.getById() -> ProductAdminDetail).
 * Mounted at /admin/prodavnica/:id/pregled (see shop.routes.ts). */
@Component({
  selector: 'app-admin-product-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, ImageUrlPipe, ContentBlocks],
  templateUrl: './admin-product-detail.html',
  styleUrl: './admin-product-detail.scss',
})
export class AdminProductDetail implements OnInit {
  private product = inject(Product);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  productId = signal<string | null>(null);
  detail = signal<ProductAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.productId.set(id);
    this.loading.set(true);
    this.product
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju proizvoda.', 'U redu', { duration: 4000 }),
      });
  }
}
