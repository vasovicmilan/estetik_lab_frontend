import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Package } from '../../services/package';
import { PackagePublicCard } from '../../models/package';
import { ApiMeta } from '../../../../core/models/api-response';
import { Seo } from '../../../../core/services/seo';

/** Public list - mounted at /paketi (see packages-catalog.routes.ts). */
@Component({
  selector: 'app-package-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatChipsModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './package-list.html',
  styleUrl: './package-list.scss',
})
export class PackageList implements OnInit {
  private pkg = inject(Package);
  private seo = inject(Seo);

  packages = signal<PackagePublicCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.seo.applyStatic('Paketi i ponude | Estetik Lab', 'Paketi tretmana po povoljnijoj ceni u Estetik Lab-u.');
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.pkg.listPublic({ page }).subscribe({
      next: ({ data, meta }) => {
        this.packages.set(data);
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
