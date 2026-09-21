import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Appointment } from '../../services/appointment';
import { EmployeePickerItem, ManualAppointmentPayload } from '../../models/appointment';
import { Service } from '../../../services-catalog/services/service';
import { ServiceListItem, ServiceVariantDisplay } from '../../../services-catalog/models/service';

/**
 * "Novi termin" - manually creates an appointment for a walk-in or phone booking
 * (POST /admin/appointments/manual). Reuses the same pick-service-then-variant
 * flow the public booking widget uses, but with a plain <input type="datetime-local">
 * instead of the slot-browsing UI (a manually created appointment is being entered
 * by staff who already agreed a time with the client over the phone, not picked
 * from live availability) and no employee-availability check client-side - the
 * backend validates the slot itself.
 *
 * Deliberate v1 simplifications (see this feature's task spec):
 *  - No existing-user search/picker - `existingUserId` is never set, every
 *    manually created appointment is entered via firstName/lastName/email/phone
 *    like a new/guest contact, even if it matches an existing account.
 *  - No "pay from an existing package purchase" option - `packagePurchaseId` and
 *    the check-package endpoint are not wired up; `priceOverride` is the only
 *    price-adjustment path exposed.
 */
@Component({
  selector: 'app-admin-appointment-manual-form',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-appointment-manual-form.html',
  styleUrl: './admin-appointment-manual-form.scss',
})
export class AdminAppointmentManualForm implements OnInit {
  private fb = inject(FormBuilder);
  private appointment = inject(Appointment);
  private service = inject(Service);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  services = signal<ServiceListItem[]>([]);
  loadingServices = signal(false);

  variants = signal<ServiceVariantDisplay[]>([]);
  loadingVariants = signal(false);

  employees = signal<EmployeePickerItem[]>([]);

  saving = signal(false);

  form = this.fb.group({
    serviceId: ['', Validators.required],
    servicePackageId: ['', Validators.required],
    employeeId: [''],
    startTime: ['', Validators.required],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', Validators.maxLength(50)],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    note: ['', Validators.maxLength(500)],
    priceOverride: [null as number | null],
  });

  ngOnInit(): void {
    this.loadingServices.set(true);
    this.service.listAdmin({ limit: 200 }).subscribe({
      next: ({ data }) => {
        this.services.set(data);
        this.loadingServices.set(false);
      },
      error: () => this.loadingServices.set(false),
    });

    this.appointment.listEmployeesForPicker().subscribe((employees) => this.employees.set(employees));
  }

  onServiceChange(serviceId: string): void {
    this.form.patchValue({ servicePackageId: '' });
    this.variants.set([]);
    if (!serviceId) return;

    this.loadingVariants.set(true);
    this.service.getById(serviceId).subscribe({
      next: (detail) => {
        this.variants.set(detail.varijante);
        this.loadingVariants.set(false);
      },
      error: () => this.loadingVariants.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    // startTime IS a real ISO instant here (unlike reschedule's naive string) -
    // built client-side from a plain datetime-local value via new Date().toISOString().
    const payload: ManualAppointmentPayload = {
      serviceId: value.serviceId!,
      servicePackageId: value.servicePackageId!,
      employeeId: value.employeeId || undefined,
      startTime: new Date(value.startTime!).toISOString(),
      firstName: value.firstName!,
      lastName: value.lastName || undefined,
      email: value.email!,
      phone: value.phone!,
      note: value.note || undefined,
      priceOverride: value.priceOverride ?? undefined,
    };

    this.saving.set(true);
    this.appointment
      .createManual(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          this.snackBar.open('Termin je kreiran.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/zakazivanja', res.appointment.id]);
        },
        error: (error) => this.snackBar.open(error?.message || 'Kreiranje termina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
