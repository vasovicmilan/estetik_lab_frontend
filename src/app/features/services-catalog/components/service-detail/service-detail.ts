import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { BookingWidget, BookingWidgetDialogData } from '../../../booking/components/booking-widget/booking-widget';
import { PublicServiceDetail, ServiceVariantDisplay } from '../../models/service';

/**
 * Pure display component - receives its data from serviceDetailResolver via
 * withComponentInputBinding(), does no fetching itself. SEO tags were already
 * applied by the resolver before this ever renders (see seo.ts). Clicking a
 * variant's "Zakaži termin" button opens BookingWidget in a MatDialog rather
 * than rendering it inline in the variant's card - see openBookingDialog().
 */
@Component({
  selector: 'app-service-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatExpansionModule, ImageUrlPipe],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss',
})
export class ServiceDetail {
  private dialog = inject(MatDialog);

  service = input<PublicServiceDetail | null>(null);

  openBookingDialog(variant: ServiceVariantDisplay): void {
    const service = this.service();
    if (!service) return;

    this.dialog.open<BookingWidget, BookingWidgetDialogData>(BookingWidget, {
      data: {
        serviceSlug: service.slug,
        servicePackageId: variant.id,
        variantName: variant.naziv,
      },
      // 480px is comfortable on desktop; 95vw keeps it near full-bleed on
      // mobile instead of Material's default fixed desktop-oriented width.
      width: '480px',
      maxWidth: '95vw',
      autoFocus: false,
    });
  }
}
