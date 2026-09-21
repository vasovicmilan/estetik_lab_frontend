import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Post } from '../../services/post';
import { PostAdminListItem } from '../../models/post';
import { ApiMeta } from '../../../../core/models/api-response';

@Component({
  selector: 'app-admin-blog-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-blog-list.html',
  styleUrl: './admin-blog-list.scss',
})
export class AdminBlogList implements OnInit {
  private post = inject(Post);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['slika', 'naslov', 'status', 'autor', 'kategorije', 'pregledi', 'istaknut', 'akcije'];
  rows = signal<PostAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.post.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: PostAdminListItem): void {
    if (!confirm(`Obrisati objavu "${row.naslov}"?`)) return;

    this.post.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Objava je obrisana.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
