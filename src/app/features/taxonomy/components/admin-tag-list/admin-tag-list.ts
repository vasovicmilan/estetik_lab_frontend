import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Tag } from '../../services/tag';
import { TagAdminListItem } from '../../models/tag';
import { ApiMeta } from '../../../../core/models/api-response';

/** Mirrors services-catalog's admin-service-list - see that component's header
 * for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-tag-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-tag-list.html',
  styleUrl: './admin-tag-list.scss',
})
export class AdminTagList implements OnInit {
  private tag = inject(Tag);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['naziv', 'domen', 'aktivan', 'akcije'];
  rows = signal<TagAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.tag.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: TagAdminListItem): void {
    if (!confirm(`Obrisati tag "${row.naziv}"?`)) return;

    this.tag.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Tag je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
