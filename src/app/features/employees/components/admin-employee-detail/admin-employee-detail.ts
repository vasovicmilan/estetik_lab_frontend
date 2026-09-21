import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Employee } from '../../services/employee';
import { EmployeeAdminDetail as EmployeeAdminDetailModel } from '../../models/employee';

/** Read-only view of GET /admin/employees/:employeeId - mirrors
 * admin-order-detail.ts's load/notFound/loading pattern, minus any action
 * buttons (this is the pure "Pregled" page; editing happens on
 * admin-employee-form, linked from here as "Izmeni"). Mounted at
 * /admin/zaposleni/:id/pregled. */
@Component({
  selector: 'app-admin-employee-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-employee-detail.html',
  styleUrl: './admin-employee-detail.scss',
})
export class AdminEmployeeDetail implements OnInit {
  private employee = inject(Employee);
  private route = inject(ActivatedRoute);

  employeeId = signal<string | null>(null);
  detail = signal<EmployeeAdminDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.employeeId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.employeeId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.employee
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.notFound.set(true),
      });
  }
}
