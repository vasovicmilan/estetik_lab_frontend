import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { BusinessPartner } from '../../services/business-partner';
import { BusinessPartnerPublicListItem } from '../../models/business-partner';

/** Public "Saradnici" list - GET /business-partners (unauthenticated, no
 * pagination: backend returns every active partner in one call), structural
 * sibling of blog-list (same card grid, no filters/search). */
@Component({
  selector: 'app-business-partner-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './business-partner-list.html',
  styleUrl: './business-partner-list.scss',
})
export class BusinessPartnerList implements OnInit {
  private businessPartner = inject(BusinessPartner);

  partners = signal<BusinessPartnerPublicListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.businessPartner.listPublic().subscribe({
      next: (data) => {
        this.partners.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
