import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteContent } from '../../../../core/services/site-content';
import { FaqContent } from '../../../../core/models/site-content';

/** Public "Česta pitanja" page at /faq - DB-backed content, previously only
 * rendered by the old EJS site. Uses mat-accordion (same treatment as every
 * other FAQ block in the app - see content-blocks.ts's FAQ case) rather than
 * native <details>/<summary>. */
@Component({
  selector: 'app-faq-page',
  imports: [CommonModule, MatExpansionModule, MatProgressSpinnerModule],
  templateUrl: './faq-page.html',
  styleUrl: './faq-page.scss',
})
export class FaqPage implements OnInit {
  private siteContent = inject(SiteContent);

  content = signal<FaqContent | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.siteContent.getFaq().subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
