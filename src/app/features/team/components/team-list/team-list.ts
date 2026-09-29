import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Team } from '../../services/team';
import { TeamMemberCard } from '../../models/expert';
import { SiteContent } from '../../../../core/services/site-content';
import { TeamIntroContent } from '../../../../core/models/site-content';
import { biIconToMaterial } from '../../../../core/utils/bi-icon-map';

@Component({
  selector: 'app-team-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
})
export class TeamList implements OnInit {
  private team = inject(Team);
  private siteContent = inject(SiteContent);

  members = signal<TeamMemberCard[]>([]);
  loading = signal(true);
  intro = signal<TeamIntroContent | null>(null);

  ngOnInit(): void {
    this.team.list().subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // DB-backed intro copy for the team page (eyebrow/title/lead + highlight
    // items) - see core/services/site-content.ts. Failure just leaves the
    // intro block hidden; the member grid below doesn't depend on it.
    this.siteContent.getTeamIntro().subscribe({
      next: (intro) => this.intro.set(intro),
      error: () => {},
    });
  }

  protected biIcon(icon: string | undefined): string {
    return biIconToMaterial(icon);
  }
}
