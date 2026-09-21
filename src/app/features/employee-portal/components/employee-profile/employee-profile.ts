import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EmployeeProfile as EmployeeProfileService } from '../../services/employee-profile';
import { EmployeeSelfProfile } from '../../models/profile';
import { EmployeeWeekDay, EmployeeWorkingHoursEntry } from '../../../employees/models/employee';

/**
 * GET /employee/profile - read-only basics (name/email/phone/services) plus a
 * self-edit working-hours form. Reuses the EXACT same working-hours editor
 * UI/logic as admin-employee-form (7 fixed Mon-Sun rows, checkbox reveals
 * from/to time inputs, one slot per day - see that component's header comment
 * for the v1 single-slot-per-day limitation this inherits unchanged), just
 * pointed at PUT /employee/profile/working-hours instead of the admin
 * create/update payload. Mounted at /zaposleni-panel/profil.
 */
@Component({
  selector: 'app-employee-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.scss',
})
export class EmployeeProfile implements OnInit {
  private fb = inject(FormBuilder);
  private employeeProfile = inject(EmployeeProfileService);
  private snackBar = inject(MatSnackBar);

  profile = signal<EmployeeSelfProfile | null>(null);
  loading = signal(true);
  saving = signal(false);

  weekDays: { value: EmployeeWeekDay; label: string }[] = [
    { value: 'monday', label: 'Ponedeljak' },
    { value: 'tuesday', label: 'Utorak' },
    { value: 'wednesday', label: 'Sreda' },
    { value: 'thursday', label: 'Četvrtak' },
    { value: 'friday', label: 'Petak' },
    { value: 'saturday', label: 'Subota' },
    { value: 'sunday', label: 'Nedelja' },
  ];

  /** Keyed by day - not a FormArray, same reasoning as admin-employee-form's
   * workingHoursForm (7 fixed rows, not user-addable/removable). */
  workingHoursForm: FormGroup = this.fb.group(
    Object.fromEntries(
      this.weekDays.map((d) => [
        d.value,
        this.fb.group({
          radi: [false],
          from: ['09:00'],
          to: ['17:00'],
        }),
      ])
    )
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.employeeProfile
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.patchWorkingHours(profile.workingHoursRaw);
        },
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje profila nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  private patchWorkingHours(entries: EmployeeWorkingHoursEntry[]): void {
    // Reset every row first - a previously-checked day that's no longer in
    // the response must go back to unchecked, not stay stuck from a stale form.
    for (const day of this.weekDays) {
      this.workingHoursForm.get(day.value)?.patchValue({ radi: false, from: '09:00', to: '17:00' });
    }
    for (const entry of entries ?? []) {
      const slot = entry.slots?.[0];
      const dayGroup = this.workingHoursForm.get(entry.day);
      if (!dayGroup || !slot) continue;
      dayGroup.patchValue({ radi: true, from: slot.from, to: slot.to });
    }
  }

  private buildWorkingHours(): EmployeeWorkingHoursEntry[] {
    const result: EmployeeWorkingHoursEntry[] = [];
    for (const day of this.weekDays) {
      const value = this.workingHoursForm.get(day.value)?.value as { radi: boolean; from: string; to: string };
      if (!value?.radi) continue;
      result.push({ day: day.value, slots: [{ from: value.from, to: value.to }] });
    }
    return result;
  }

  submit(): void {
    const workingHours = this.buildWorkingHours();

    this.saving.set(true);
    this.employeeProfile
      .updateWorkingHours(workingHours)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Radno vreme je sačuvano.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje radnog vremena nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
