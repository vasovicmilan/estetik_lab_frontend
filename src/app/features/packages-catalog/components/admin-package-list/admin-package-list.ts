import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Package } from '../../services/package';
import { PackageListItem } from '../../models/package';
import { ApiMeta } from '../../../../core/models/api-response';

@Component({
  selector: 'app-admin-package-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-package-list.html',
  styleUrl: './admin-package-list.scss',
})
export class AdminPackageList implements OnInit {
  private pkg = inject(Package);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['slika', 'naziv', 'stavke', 'cena', 'najbolji', 'aktivan', 'akcije'];
  rows = signal<PackageListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.pkg.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: PackageListItem): void {
    if (!confirm(`Obrisati paket "${row.naziv}"?`)) return;

    this.pkg.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Paket je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
