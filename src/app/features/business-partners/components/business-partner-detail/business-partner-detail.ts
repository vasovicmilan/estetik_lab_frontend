import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { ContentBlocks } from '../../../../shared/ui/content-blocks/content-blocks';
import { BusinessPartnerPublicDetail } from '../../models/business-partner';

/** Public "Saradnik" detail page - structural sibling of blog-detail (same
 * hero image + <app-content-blocks> body), plus an address/map link block and
 * an outbound CTA button that blog-detail has no equivalent of.
 *
 * SEO (title, description, canonical, OG/Twitter, JSON-LD) comes from the backend
 * and is applied by businessPartnerDetailResolver, like every other detail page. */
@Component({
  selector: 'app-business-partner-detail',
  imports: [CommonModule, RouterLink, ImageUrlPipe, ContentBlocks],
  templateUrl: './business-partner-detail.html',
  styleUrl: './business-partner-detail.scss',
})
export class BusinessPartnerDetail {
  partner = input<BusinessPartnerPublicDetail | null>(null);

  mapsUrl = computed(() => {
    const p = this.partner();
    if (!p?.geo) return null;
    return `https://www.google.com/maps?q=${p.geo.latitude},${p.geo.longitude}`;
  });
}
