import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Resource } from '../../services/resource';
import { ResourceAdminDetail } from '../../models/resource';

/** Read-only view of GET /admin/resources/:id (Resource.getById() -> ResourceAdminDetail).
 * Mounted at /admin/resursi/:id/pregled (see taxonomy.routes.ts). */
@Component({
  selector: 'app-admin-resource-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-resource-detail.html',
  styleUrl: './admin-resource-detail.scss',
})
export class AdminResourceDetail implements OnInit {
  private resource = inject(Resource);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  resourceId = signal<string | null>(null);
  detail = signal<ResourceAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.resourceId.set(id);
    this.loading.set(true);
    this.resource
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju resursa.', 'U redu', { duration: 4000 }),
      });
  }
}
