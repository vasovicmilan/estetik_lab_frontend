import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * Light wrapper for every /partner-panel/* page - same pattern as EmployeeShell
 * (see that component's header comment): a row of route-linked
 * mat-tab-nav-bar tabs plus a <router-outlet>, not a copy of AdminShell's
 * dense sidenav. This is a partner-facing self-service area, not an admin
 * one.
 *
 * Unlike EmployeeShell, every tab is always shown - there's no per-partner
 * "commission based or not" split here, all partners see dashboard/earnings/
 * catalog.
 */
@Component({
  selector: 'app-partner-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule],
  templateUrl: './partner-shell.html',
  styleUrl: './partner-shell.scss',
})
export class PartnerShell {}
