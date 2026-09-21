import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Resource } from '../../services/resource';
import { ResourceAdminListItem } from '../../models/resource';
import { ApiMeta } from '../../../../core/models/api-response';

/** Mirrors services-catalog's admin-service-list - see that component's header
 * for the load/paginate/delete pattern this repeats. */
@Component({
  selector: 'app-admin-resource-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './admin-resource-list.html',
  styleUrl: './admin-resource-list.scss',
})
export class AdminResourceList implements OnInit {
  private resource = inject(Resource);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['naziv', 'kapacitet', 'aktivan', 'akcije'];
  rows = signal<ResourceAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.resource.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: ResourceAdminListItem): void {
    if (!confirm(`Obrisati resurs "${row.naziv}"?`)) return;

    this.resource.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Resurs je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
