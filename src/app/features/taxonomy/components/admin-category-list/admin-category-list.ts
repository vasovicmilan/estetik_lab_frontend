import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Category } from '../../services/category';
import { CategoryAdminListItem } from '../../models/category';
import { ApiMeta } from '../../../../core/models/api-response';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';

/** Mirrors services-catalog's admin-service-list exactly - see that component's
 * header for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-category-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-category-list.html',
  styleUrl: './admin-category-list.scss',
})
export class AdminCategoryList implements OnInit {
  private category = inject(Category);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  displayedColumns = ['slika', 'naziv', 'domen', 'roditelj', 'prioritet', 'aktivna', 'akcije'];
  rows = signal<CategoryAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.category.listAdmin({ page, limit: 10 }).subscribe({
      next: ({ data, meta }) => {
        this.rows.set(data);
        this.meta.set(meta ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.load(event.pageIndex + 1);
  }

  remove(row: CategoryAdminListItem): void {
    this.confirmDialog.confirm({ message: `Obrisati kategoriju "${row.naziv}"?` }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.category.delete(row.id).subscribe({
        next: () => {
          this.snackBar.open('Kategorija je obrisana.', 'U redu', { duration: 3000 });
          this.load(this.meta()?.page ?? 1);
        },
        error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
    });
  }
}
