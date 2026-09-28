import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Service } from '../../services/service';
import { ServicePublicCard } from '../../models/service';
import { ApiMeta } from '../../../../core/models/api-response';
import { Seo } from '../../../../core/services/seo';

/** Public list - mounted at /usluge (see services-catalog.routes.ts). Same
 * paginated-grid pattern as blog-list/team-list. */
@Component({
  selector: 'app-service-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatChipsModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './service-list.html',
  styleUrl: './service-list.scss',
})
export class ServiceList implements OnInit {
  private service = inject(Service);
  private seo = inject(Seo);

  services = signal<ServicePublicCard[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.seo.applyStatic('Usluge | Estetik Lab', 'Pregled svih estetskih tretmana i usluga koje nudi Estetik Lab.');
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.service.listPublic({ page }).subscribe({
      next: ({ data, meta }) => {
        this.services.set(data);
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
