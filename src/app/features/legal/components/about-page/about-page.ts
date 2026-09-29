import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteContent } from '../../../../core/services/site-content';
import { AboutContent } from '../../../../core/models/site-content';
import { ContentSections } from '../../../../shared/ui/content-sections/content-sections';

/** Public "O nama" page at /o-nama - DB-backed content (see
 * core/services/site-content.ts), previously not exposed on the SPA at all
 * (the old EJS site had it, the Angular one didn't - see the frontend backlog's
 * "static/legal pages" item). */
@Component({
  selector: 'app-about-page',
  imports: [CommonModule, MatProgressSpinnerModule, ContentSections],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
})
export class AboutPage implements OnInit {
  private siteContent = inject(SiteContent);

  content = signal<AboutContent | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.siteContent.getAbout().subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
