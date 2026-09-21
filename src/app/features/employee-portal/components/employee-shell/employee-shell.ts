import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeeDashboard } from '../../services/employee-dashboard';

/**
 * Light wrapper for every /zaposleni-panel/* page - same pattern as AccountShell
 * (see that component's header comment): a small row of tab-like links plus a
 * <router-outlet>, not a copy of AdminShell's dense sidenav. This is a
 * staff-facing self-service area, not an admin one.
 *
 * The "Provizije" tab is only shown once we know isCommissionBased - fetched
 * here (once, shell-level) via the dashboard endpoint rather than duplicating
 * the same isCommissionBased fetch in every child page.
 */
@Component({
  selector: 'app-employee-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './employee-shell.html',
  styleUrl: './employee-shell.scss',
})
export class EmployeeShell implements OnInit {
  private employeeDashboard = inject(EmployeeDashboard);

  isCommissionBased = signal(false);
  loadingFlag = signal(true);

  ngOnInit(): void {
    this.employeeDashboard
      .get()
      .pipe(finalize(() => this.loadingFlag.set(false)))
      .subscribe({
        next: (dashboard) => this.isCommissionBased.set(dashboard.isCommissionBased),
        // Best-effort: if this fails, the tab just stays hidden - the child
        // pages do their own error handling for the actual dashboard content.
        error: () => this.loadingFlag.set(false),
      });
  }
}
