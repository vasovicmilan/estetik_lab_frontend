import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Light wrapper for every /moj-nalog/* page - a small row of tab-like links
 * plus a <router-outlet>. Deliberately NOT a copy of AdminShell's sidenav: this
 * is a public/customer-facing area with a handful of sections, not a dense
 * admin panel, so a simple horizontal nav is enough (see the task spec's "much
 * lighter" guidance).
 */
@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './account-shell.html',
  styleUrl: './account-shell.scss',
})
export class AccountShell {}
