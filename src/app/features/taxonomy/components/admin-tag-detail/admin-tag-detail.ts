import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Tag } from '../../services/tag';
import { TagAdminDetail } from '../../models/tag';

/** Read-only view of GET /admin/tags/:id (Tag.getById() -> TagAdminDetail).
 * Mounted at /admin/tagovi/:id/pregled (see taxonomy.routes.ts). */
@Component({
  selector: 'app-admin-tag-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-tag-detail.html',
  styleUrl: './admin-tag-detail.scss',
})
export class AdminTagDetail implements OnInit {
  private tag = inject(Tag);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  tagId = signal<string | null>(null);
  detail = signal<TagAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.tagId.set(id);
    this.loading.set(true);
    this.tag
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju taga.', 'U redu', { duration: 4000 }),
      });
  }
}
