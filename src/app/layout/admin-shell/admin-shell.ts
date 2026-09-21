import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../core/services/auth';

/**
 * Layout for every /admin/* section - a persistent sidebar (grouped, permission-gated
 * links to each of the 8 admin areas) plus a <router-outlet> for the section itself.
 * Mounted once at the 'admin' parent route in app.routes.ts; every admin/* route is
 * now a child of this shell instead of its own top-level island (see that file's
 * header comment for the guard-nesting rationale).
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatSidenavModule, MatListModule, MatIconModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  auth = inject(Auth);
}
