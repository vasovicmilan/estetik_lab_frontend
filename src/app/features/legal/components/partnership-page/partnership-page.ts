import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteContent } from '../../../../core/services/site-content';
import { PartnershipContent } from '../../../../core/models/site-content';

/** Public "Partnerski program" page at /partnerski-program - DB-backed
 * content, previously only rendered by the old EJS site. Onboarding steps are
 * numbered by the backend's own `number` field (not array index), same
 * reasoning as content-blocks.ts's ordered-list counter. */
@Component({
  selector: 'app-partnership-page',
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './partnership-page.html',
  styleUrl: './partnership-page.scss',
})
export class PartnershipPage implements OnInit {
  private siteContent = inject(SiteContent);

  content = signal<PartnershipContent | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.siteContent.getPartnershipProgram().subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
