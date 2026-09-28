import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteContent } from '../../../../core/services/site-content';
import { LegalPageContent } from '../../../../core/models/site-content';
import { Seo } from '../../../../core/services/seo';
import { ContentSections } from '../../../../shared/ui/content-sections/content-sections';

/** Public "Politika privatnosti" page at /politika-privatnosti - DB-backed
 * content, previously only rendered by the old EJS site. */
@Component({
  selector: 'app-privacy-policy-page',
  imports: [CommonModule, MatProgressSpinnerModule, ContentSections],
  templateUrl: './privacy-policy-page.html',
  styleUrl: './privacy-policy-page.scss',
})
export class PrivacyPolicyPage implements OnInit {
  private siteContent = inject(SiteContent);
  private seo = inject(Seo);

  content = signal<LegalPageContent | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.seo.applyStatic('Politika privatnosti | Estetik Lab', 'Kako Estetik Lab prikuplja, koristi i štiti vaše podatke.');
    this.siteContent.getPrivacyPolicy().subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
