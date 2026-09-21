import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { TeamMemberDetail } from '../../models/expert';

@Component({
  selector: 'app-team-detail',
  imports: [CommonModule, RouterLink, MatChipsModule, ImageUrlPipe],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
})
export class TeamDetail {
  member = input<TeamMemberDetail | null>(null);
}
