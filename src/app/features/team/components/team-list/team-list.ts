import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Team } from '../../services/team';
import { TeamMemberCard } from '../../models/expert';

@Component({
  selector: 'app-team-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
})
export class TeamList implements OnInit {
  private team = inject(Team);

  members = signal<TeamMemberCard[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.team.list().subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
