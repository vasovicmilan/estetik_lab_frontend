import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Service } from '../../services/service';
import { ServiceDetail } from '../../models/service';

/** Read-only view of GET /admin/services/:id (Service.getById() -> ServiceDetail) -
 * same ngOnInit-fetch-by-route-id pattern as admin-service-form.ts, just without
 * a form. Mounted at /admin/usluge/:id/pregled (see services-catalog.routes.ts). */
@Component({
  selector: 'app-admin-service-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-service-detail.html',
  styleUrl: './admin-service-detail.scss',
})
export class AdminServiceDetail implements OnInit {
  private service = inject(Service);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  serviceId = signal<string | null>(null);
  detail = signal<ServiceDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.serviceId.set(id);
    this.loading.set(true);
    this.service
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju usluge.', 'U redu', { duration: 4000 }),
      });
  }
}
