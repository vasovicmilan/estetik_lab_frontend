import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { BookingWidget } from '../../../booking/components/booking-widget/booking-widget';
import { PublicServiceDetail, ServiceVariantDisplay } from '../../models/service';

/**
 * Pure display component - receives its data from serviceDetailResolver via
 * withComponentInputBinding(), does no fetching itself. SEO tags were already
 * applied by the resolver before this ever renders (see seo.ts). The one bit of
 * local state (bookingVariant) just tracks which variant's "Zakaži termin" button
 * was clicked, to show that variant's booking-widget inline.
 */
@Component({
  selector: 'app-service-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, ImageUrlPipe, BookingWidget],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss',
})
export class ServiceDetail {
  service = input<PublicServiceDetail | null>(null);

  bookingVariant = signal<ServiceVariantDisplay | null>(null);

  toggleBooking(variant: ServiceVariantDisplay): void {
    this.bookingVariant.set(this.bookingVariant()?.id === variant.id ? null : variant);
  }
}
