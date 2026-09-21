import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Team } from '../../services/team';
import { ExpertAdminListItem } from '../../models/expert';
import { ApiMeta } from '../../../../core/models/api-response';

@Component({
  selector: 'app-admin-team-list',
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-team-list.html',
  styleUrl: './admin-team-list.scss',
})
export class AdminTeamList implements OnInit {
  private team = inject(Team);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['slika', 'imePrezime', 'titula', 'brojUsluga', 'aktivan', 'akcije'];
  rows = signal<ExpertAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.team.listAdmin({ page, limit: 10 }).subscribe({
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

  remove(row: ExpertAdminListItem): void {
    if (!confirm(`Obrisati člana tima "${row.imePrezime}"?`)) return;

    this.team.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Član tima je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
