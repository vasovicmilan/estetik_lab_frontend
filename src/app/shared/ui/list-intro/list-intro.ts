import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ListIntroContent } from '../../../core/models/site-content';
import { biIconToMaterial } from '../../../core/utils/bi-icon-map';

/**
 * Intro block of a public listing page (usluge, paketi, prodavnica, blog): eyebrow,
 * H1, lead, extra paragraphs, highlight cards - and, for the shop, the "trust" cards
 * and FAQ. Purely presentational: every word comes from the backend
 * (GET /list-intro/:page, SiteContent in MongoDB), which is also what the EJS site
 * renders. `fallbackTitle` is only the H1 shown if that request failed.
 */
@Component({
  selector: 'app-list-intro',
  imports: [MatIconModule],
  templateUrl: './list-intro.html',
  styleUrl: './list-intro.scss',
})
export class ListIntro {
  intro = input<ListIntroContent | null>(null);
  fallbackTitle = input('');
  /** 'intro' = eyebrow/H1/lead/cards/trust, 'faq' = only the FAQ (rendered at the very end of the page), 'all' = everything. */
  part = input<'intro' | 'faq' | 'all'>('all');
  showIntro = computed(() => this.part() !== 'faq');
  showFaq = computed(() => this.part() !== 'intro');

  cards = computed(() => this.intro()?.highlights ?? []);
  trust = computed(() => this.intro()?.trust ?? []);
  faq = computed(() => this.intro()?.faq ?? []);

  icon(bi: string): string {
    return biIconToMaterial(bi);
  }
}
