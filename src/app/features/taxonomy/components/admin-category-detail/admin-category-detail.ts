import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Category } from '../../services/category';
import { CategoryAdminDetail } from '../../models/category';

/** Read-only view of GET /admin/categories/:id (Category.getById() -> CategoryAdminDetail).
 * Mounted at /admin/kategorije/:id/pregled (see taxonomy.routes.ts). */
@Component({
  selector: 'app-admin-category-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-category-detail.html',
  styleUrl: './admin-category-detail.scss',
})
export class AdminCategoryDetail implements OnInit {
  private category = inject(Category);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  categoryId = signal<string | null>(null);
  detail = signal<CategoryAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.categoryId.set(id);
    this.loading.set(true);
    this.category
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju kategorije.', 'U redu', { duration: 4000 }),
      });
  }
}
