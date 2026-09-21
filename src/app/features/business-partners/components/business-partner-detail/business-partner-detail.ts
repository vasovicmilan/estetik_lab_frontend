import { Component, computed, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { BusinessPartnerPublicDetail } from '../../models/business-partner';

/** Public "Saradnik" detail page - structural sibling of blog-detail (same
 * hero image + <app-content-blocks> body), plus an address/map link block and
 * an outbound CTA button that blog-detail has no equivalent of.
 *
 * Does NOT call Seo.apply() the way blog-detail's resolver does - see
 * BusinessPartnerPublicDetail.seo's own comment for why: this page instead
 * sets just the document title directly off `naziv`. */
@Component({
  selector: 'app-business-partner-detail',
  imports: [CommonModule, RouterLink, ImageUrlPipe, ContentBlocks],
  templateUrl: './business-partner-detail.html',
  styleUrl: './business-partner-detail.scss',
})
export class BusinessPartnerDetail {
  private titleService = inject(Title);

  partner = input<BusinessPartnerPublicDetail | null>(null);

  mapsUrl = computed(() => {
    const p = this.partner();
    if (!p?.geo) return null;
    return `https://www.google.com/maps?q=${p.geo.latitude},${p.geo.longitude}`;
  });

  constructor() {
    effect(() => {
      const p = this.partner();
      if (p) this.titleService.setTitle(`${p.naziv} | Estetik Lab`);
    });
  }
}
