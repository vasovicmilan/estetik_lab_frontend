import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Auth } from '../../core/services/auth';
import { SiteInfo } from '../../core/services/site-info';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  auth = inject(Auth);
  protected readonly site = inject(SiteInfo);
  private breakpointObserver = inject(BreakpointObserver);

  /** Same 768px breakpoint as AdminShell/DataTable, for the same reason - below
   * it, the full link row (7+ public links plus conditional admin/employee/
   * partner links, cart, account) no longer fits and just wrapped into several
   * messy rows instead of collapsing behind a menu button. */
  isHandset = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the mobile dropdown after a nav link is clicked - same reasoning
   * as AdminShell's onNavClick for its overlay sidenav. Harmless to call when
   * not in handset mode (menuOpen stays irrelevant there, nav is always shown). */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenu();
  }
}
