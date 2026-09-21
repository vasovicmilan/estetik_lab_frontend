import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Team } from '../../services/team';
import { ExpertAdminDetail } from '../../models/expert';

/** Read-only view of GET /admin/experts/:id (Team.getById() -> ExpertAdminDetail).
 * Mounted at /admin/tim/:id/pregled (see team.routes.ts). */
@Component({
  selector: 'app-admin-team-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-team-detail.html',
  styleUrl: './admin-team-detail.scss',
})
export class AdminTeamDetail implements OnInit {
  private team = inject(Team);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  memberId = signal<string | null>(null);
  detail = signal<ExpertAdminDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.memberId.set(id);
    this.loading.set(true);
    this.team
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju člana tima.', 'U redu', { duration: 4000 }),
      });
  }
}
