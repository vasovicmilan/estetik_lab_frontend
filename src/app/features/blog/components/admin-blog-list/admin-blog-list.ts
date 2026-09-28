import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Post } from '../../services/post';
import { PostAdminListItem } from '../../models/post';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

@Component({
  selector: 'app-admin-blog-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-blog-list.html',
  styleUrl: './admin-blog-list.scss',
})
export class AdminBlogList implements OnInit {
  private post = inject(Post);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<PostAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  private search = '';
  /** `naslov`/`status`/`pregledi`/`istaknut`/`kreiran` are plain scalar columns
   * (title, status, views, isFeatured, createdAt) on the Post schema - see
   * BLOG_SORT_FIELDS in admin-marketing.controller.js. `autor` (populated
   * author name) and `kategorije` (populated category names, joined) are NOT
   * sortable. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** postRepo.findPosts's default (no sortBy given) is POST_SORT_OPTIONS.publishedAt
   * ({ publishedAt: -1, createdAt: -1, _id: -1 }) - no column here maps to
   * publishedAt (only `kreiran`/createdAt, its tie-break, is a column), so no
   * defaultSort indicator is shown, same reasoning as admin-user-list. */

  columns: DataTableColumn<PostAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'naslov', label: 'Naslov', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'autor', label: 'Autor' },
    { key: 'kategorije', label: 'Kategorije', value: (row) => row.kategorije.join(', ') },
    { key: 'pregledi', label: 'Pregledi', sortable: true },
    { key: 'istaknut', label: 'Istaknuto', sortable: true },
  ];

  actions: DataTableAction<PostAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/blog', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/blog', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati objavu?', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.post
      .listAdmin({
        page,
        limit: this.limit,
        search: this.search || undefined,
        sort: this.sort ?? undefined,
        order: this.order ?? undefined,
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju objava.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.limit = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  onSearch(term: string): void {
    this.search = term;
    this.load(1);
  }

  onSort(sort: Sort): void {
    this.sort = sort.direction ? sort.active : null;
    this.order = sort.direction ? (sort.direction as 'asc' | 'desc') : null;
    this.load(1);
  }

  remove(row: PostAdminListItem): void {
    this.post.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Objava je obrisana.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
