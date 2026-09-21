import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Package } from '../../services/package';
import { PackageAdminDetail } from '../../models/package';

/** Read-only view of GET /admin/packages/:id (Package.getById() -> PackageAdminDetail).
 * Mounted at /admin/paketi/:id/pregled (see packages-catalog.routes.ts). */
@Component({
  selector: 'app-admin-package-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-package-detail.html',
  styleUrl: './admin-package-detail.scss',
})
export class AdminPackageDetail implements OnInit {
  private pkgService = inject(Package);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  packageId = signal<string | null>(null);
  detail = signal<PackageAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.packageId.set(id);
    this.loading.set(true);
    this.pkgService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju paketa.', 'U redu', { duration: 4000 }),
      });
  }
}
