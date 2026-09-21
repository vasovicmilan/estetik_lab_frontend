import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Service } from '../../services/service';
import { ServiceListItem } from '../../models/service';
import { ApiMeta } from '../../../../core/models/api-response';

@Component({
  selector: 'app-admin-service-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-service-list.html',
  styleUrl: './admin-service-list.scss',
})
export class AdminServiceList implements OnInit {
  private service = inject(Service);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['slika', 'naziv', 'kategorije', 'brojVarijanti', 'aktivna', 'akcije'];
  rows = signal<ServiceListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.service.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: ServiceListItem): void {
    if (!confirm(`Obrisati uslugu "${row.naziv}"?`)) return;

    this.service.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Usluga je obrisana.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
