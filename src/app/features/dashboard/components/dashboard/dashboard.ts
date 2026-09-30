import { SiteInfo } from '../../../../core/services/site-info';
import { SiteModules } from '../../../../core/models/business-info';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Auth } from '../../../../core/services/auth';
import { DashboardService } from '../../services/dashboard';
import { DashboardData } from '../../models/dashboard';

interface StatTile {
  key: keyof DashboardData['stats'];
  /** Prikazuje se samo ako je taj modul uključen u ovoj instanci. */
  module?: keyof SiteModules;
  label: string;
  /** Admin route this count plausibly maps to, or null when no admin section
   * exists yet for it (most stats - see this feature's header comment in
   * app.routes.ts / the task that introduced this component). */
  link: string | null;
  /** Permission required to actually reach `link`, so a tile never links
   * somewhere the current admin would immediately get redirect-guarded off of. */
  linkPermission: string | null;
}

/**
 * /admin landing page (default child of the 'admin' parent route). One combined
 * GET /admin/dashboard call - unlike most pages in this app there's a single
 * `loading` signal, not several independent per-widget ones, because the backend
 * already aggregates stats + recent-activity previews into one response.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  auth = inject(Auth);
  protected readonly site = inject(SiteInfo);

  loading = signal(true);
  data = signal<DashboardData | null>(null);

  readonly tileDefs: StatTile[] = [
    { key: 'pendingAppointments', label: 'Termini na čekanju', link: null, linkPermission: null, module: 'booking' },
    { key: 'confirmedAppointments', label: 'Potvrđeni termini', link: null, linkPermission: null, module: 'booking' },
    { key: 'unassignedAppointments', label: 'Nedodeljeni termini', link: null, linkPermission: null, module: 'booking' },
    { key: 'todayAppointments', label: 'Termini danas', link: null, linkPermission: null, module: 'booking' },
    { key: 'newContacts', label: 'Novi kontakti', link: null, linkPermission: null },
    { key: 'activeEmployees', label: 'Aktivni zaposleni', link: '/admin/tim', linkPermission: 'manage_employees', module: 'employees' },
    { key: 'totalUsers', label: 'Ukupno korisnika', link: null, linkPermission: null },
    { key: 'activePackagePurchases', label: 'Aktivne kupovine paketa', link: null, linkPermission: null, module: 'booking' },
    { key: 'pendingOrders', label: 'Porudžbine na čekanju', link: '/admin/porudzbine', linkPermission: 'manage_orders', module: 'shop' },
    { key: 'outOfStockProducts', label: 'Proizvodi bez zalihe', link: '/admin/prodavnica', linkPermission: 'manage_products', module: 'shop' },
    { key: 'pendingPayoutRequests', label: 'Zahtevi za isplatu', link: null, linkPermission: null, module: 'partners' },
    { key: 'pendingTestimonials', label: 'Utisci na čekanju', link: null, linkPermission: null },
    { key: 'inactiveResources', label: 'Neaktivni resursi', link: '/admin/resursi', linkPermission: 'manage_resources', module: 'booking' },
    { key: 'newsletterSubscribers', label: 'Pretplatnici na newsletter', link: null, linkPermission: null },
  ];

  tiles = computed(() => {
    const stats = this.data()?.stats;
    if (!stats) return [];
    return this.tileDefs
      .filter((def) => !def.module || this.site.modules()[def.module])
      .map((def) => {
      const value = stats[def.key];
      const canLink = def.link !== null && value > 0 && (def.linkPermission === null || this.auth.hasPermission(def.linkPermission));
      return { ...def, value, link: canLink ? def.link : null };
    });
  });

  ngOnInit(): void {
    this.dashboardService.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
