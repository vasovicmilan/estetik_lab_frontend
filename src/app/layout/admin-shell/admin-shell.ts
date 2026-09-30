import { Component, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Auth } from '../../core/services/auth';
import { SiteInfo } from '../../core/services/site-info';

/**
 * Layout for every /admin/* section - a sidebar (grouped, permission-gated links to
 * each of the 8 admin areas) plus a <router-outlet> for the section itself.
 * Mounted once at the 'admin' parent route in app.routes.ts; every admin/* route is
 * now a child of this shell instead of its own top-level island (see that file's
 * header comment for the guard-nesting rationale).
 *
 * Responsive behavior: above 768px (matching DataTable's own
 * `(max-width: 768px)` breakpoint convention, for consistency across the app)
 * the sidenav stays `mode="side"`/`opened` exactly as before, with no toggle
 * shown. Below it, the sidenav becomes an `"over"` overlay that starts closed,
 * a hamburger button appears in a new top toolbar to open/close it, and
 * picking a nav link (or the "back to site" link) closes it again - the usual
 * expectation for an overlay nav on mobile.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatSidenavModule, MatListModule, MatIconModule, MatToolbarModule, MatButtonModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  /** Uključeni moduli ove instance - stavke menija za isključen modul se ne prikazuju. */
  protected readonly site = inject(SiteInfo);

  auth = inject(Auth);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  /** Same breakpoint DataTable already established - see that component's
   * `isHandset` for the rationale (covers Handset + TabletPortrait in one query). */
  isHandset = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  onNavClick(): void {
    if (this.isHandset()) {
      this.sidenav.close();
    }
  }
}
