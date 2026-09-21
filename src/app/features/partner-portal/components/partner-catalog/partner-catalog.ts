import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { PartnerCatalogService } from '../../services/partner-catalog';
import { PartnerCatalog as PartnerCatalogModel } from '../../models/catalog';

/**
 * Referral catalog - three independently-paginated sections (Usluge/Paketi/
 * Artikli), each item showing a copyable referral link. Artikli is hidden
 * entirely when !hasProductDiscount (see catalog.ts's header comment - the
 * backend leaves products empty in that case anyway, but the section itself
 * would be pointless to show).
 *
 * One shared search box re-queries all three lists together (simplest
 * approach that matches the single GET /partner/catalog?search= endpoint -
 * there's no per-section search on the backend), resetting all three back to
 * page 1 on a new search. Each section then pages independently via its own
 * *Page query param.
 *
 * Copying a link uses navigator.clipboard.writeText(), guarded behind
 * isPlatformBrowser (same SSR-guard pattern as auth.ts's localStorage use) -
 * this app renders on the server first, where there is no navigator/clipboard.
 * Mounted at /partner-panel/katalog.
 */
@Component({
  selector: 'app-partner-catalog',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './partner-catalog.html',
  styleUrl: './partner-catalog.scss',
})
export class PartnerCatalog implements OnInit {
  private partnerCatalog = inject(PartnerCatalogService);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  loading = signal(true);
  catalog = signal<PartnerCatalogModel | null>(null);

  search = signal('');
  private servicesPage = signal(1);
  private packagesPage = signal(1);
  private productsPage = signal(1);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.partnerCatalog
      .get({
        search: this.search() || undefined,
        servicesPage: this.servicesPage(),
        packagesPage: this.packagesPage(),
        productsPage: this.productsPage(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (catalog) => this.catalog.set(catalog),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje kataloga nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.servicesPage.set(1);
    this.packagesPage.set(1);
    this.productsPage.set(1);
    this.load();
  }

  servicesPageChange(page: number): void {
    this.servicesPage.set(page);
    this.load();
  }

  packagesPageChange(page: number): void {
    this.packagesPage.set(page);
    this.load();
  }

  productsPageChange(page: number): void {
    this.productsPage.set(page);
    this.load();
  }

  copyLink(link: string | null): void {
    if (!link) return;
    if (!this.isBrowser || !navigator.clipboard) {
      this.snackBar.open('Kopiranje nije podržano u ovom pregledaču.', 'U redu', { duration: 3000 });
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => this.snackBar.open('Link je kopiran.', 'U redu', { duration: 2000 }))
      .catch(() => this.snackBar.open('Kopiranje nije uspelo.', 'U redu', { duration: 3000 }));
  }
}
