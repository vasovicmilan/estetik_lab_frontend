import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteContent } from '../../../../core/services/site-content';
import { LegalPageContent } from '../../../../core/models/site-content';
import { Seo } from '../../../../core/services/seo';
import { ContentSections } from '../../../../shared/ui/content-sections/content-sections';

/** Public "Uslovi korišćenja" page at /uslovi-koriscenja - DB-backed content,
 * previously only rendered by the old EJS site. */
@Component({
  selector: 'app-terms-page',
  imports: [CommonModule, MatProgressSpinnerModule, ContentSections],
  templateUrl: './terms-page.html',
  styleUrl: './terms-page.scss',
})
export class TermsPage implements OnInit {
  private siteContent = inject(SiteContent);
  private seo = inject(Seo);

  content = signal<LegalPageContent | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.seo.applyStatic('Uslovi korišćenja | Estetik Lab', 'Uslovi korišćenja sajta, zakazivanja termina i kupovine u Estetik Lab prodavnici.');
    this.siteContent.getTerms().subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
