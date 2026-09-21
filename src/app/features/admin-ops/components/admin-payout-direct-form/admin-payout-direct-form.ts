import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminPayoutRequest } from '../../services/payout-request';

/** Standalone form for POST /admin/payout-requests/direct - records an
 * already-happened payout directly, skipping the request/approve/pay flow.
 * earnerId is a plain text field (no picker needed per the task spec) - the
 * admin pastes the employee/partner id. Mounted at
 * /admin/isplate/direktna-isplata. */
@Component({
  selector: 'app-admin-payout-direct-form',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './admin-payout-direct-form.html',
  styleUrl: './admin-payout-direct-form.scss',
})
export class AdminPayoutDirectForm {
  private fb = inject(FormBuilder);
  private payoutRequest = inject(AdminPayoutRequest);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);

  earnerTypeOptions: { value: 'employee' | 'partner'; label: string }[] = [
    { value: 'employee', label: 'Zaposleni' },
    { value: 'partner', label: 'Partner' },
  ];

  form = this.fb.group({
    earnerType: ['employee' as 'employee' | 'partner', Validators.required],
    earnerId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { earnerType, earnerId, amount, note } = this.form.getRawValue();

    this.saving.set(true);
    this.payoutRequest
      .recordDirect({
        earnerType: earnerType!,
        earnerId: earnerId!.trim(),
        amount: amount!,
        note: note?.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Isplata je zabeležena.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/isplate']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Beleženje isplate nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
