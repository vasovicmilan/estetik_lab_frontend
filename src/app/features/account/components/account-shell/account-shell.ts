import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * Light wrapper for every /moj-nalog/* page - a row of route-linked tabs plus
 * a <router-outlet>. Deliberately NOT a copy of AdminShell's sidenav: this is
 * a public/customer-facing area with a handful of sections, not a dense admin
 * panel, so a simple horizontal nav is enough (see the task spec's "much
 * lighter" guidance). Was a plain <nav> of links styled to look like tabs -
 * now genuinely Angular Material's mat-tab-nav-bar (the route-navigation
 * variant of mat-tab-group, made for exactly this: a handful of tabs that
 * are each their own route rather than in-page content panels).
 */
@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule],
  templateUrl: './account-shell.html',
  styleUrl: './account-shell.scss',
})
export class AccountShell {}
