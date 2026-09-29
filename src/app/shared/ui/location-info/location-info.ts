import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LocationContent } from '../../../core/models/site-content';

const DAY_LABELS: Record<string, string> = {
  monday: 'Ponedeljak',
  tuesday: 'Utorak',
  wednesday: 'Sreda',
  thursday: 'Četvrtak',
  friday: 'Petak',
  saturday: 'Subota',
  sunday: 'Nedelja',
};

/**
 * "Gde se nalazimo": address, Google Maps embed, working hours and the Google-sign-in
 * data notice. All values come from the backend (SiteContent.contactPage + the salon
 * working hours from SiteSettings) - shared by the home page and the contact page.
 * The embed URL is validated server-side to start with https://www.google.com/maps/embed
 * before it can be saved, which is why bypassing Angular's URL sanitizer for it is safe.
 */
@Component({
  selector: 'app-location-info',
  imports: [RouterLink],
  templateUrl: './location-info.html',
  styleUrl: './location-info.scss',
})
export class LocationInfo {
  private sanitizer = inject(DomSanitizer);

  location = input<LocationContent | null>(null);

  mapUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.location()?.mapEmbedUrl;
    return url && url.startsWith('https://www.google.com/maps/embed') ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  hours = computed(() => (this.location()?.workingHours ?? []).map((wh) => ({ ...wh, label: DAY_LABELS[wh.day] ?? wh.day })));
  hasHours = computed(() => this.hours().some((wh) => wh.isOpen));
}
