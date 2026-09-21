import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
 * UI/logic as admin-employee-form (7 fixed Mon-Sun rows, checkbox reveals a
 * FormArray of from/to slot rows, add/remove supported - see that
 * component's header comment), just pointed at PUT
 * /employee/profile/working-hours instead of the admin create/update
 * payload. Mounted at /zaposleni-panel/profil.
 */
@Component({
  selector: 'app-employee-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
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

  /** Top level keyed by day (7 fixed rows, not user-addable), same reasoning
   * as admin-employee-form's workingHoursForm - but each day's `slots` is a
   * FormArray so more than one time range per day is supported. */
  workingHoursForm: FormGroup = this.fb.group(
    Object.fromEntries(
      this.weekDays.map((d) => [
        d.value,
        this.fb.group({
          radi: [false],
          slots: this.fb.array([this.buildSlotGroup()]),
        }),
      ])
    )
  );

  private buildSlotGroup(from = '09:00', to = '17:00'): FormGroup {
    return this.fb.group({ from: [from], to: [to] });
  }

  slotsFor(day: EmployeeWeekDay): FormArray {
    return this.workingHoursForm.get(day)?.get('slots') as FormArray;
  }

  addSlot(day: EmployeeWeekDay): void {
    this.slotsFor(day).push(this.buildSlotGroup());
  }

  removeSlot(day: EmployeeWeekDay, index: number): void {
    const slots = this.slotsFor(day);
    if (slots.length > 1) slots.removeAt(index);
  }

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
    // Reset every row first - a previously-checked day (or extra slots) that's
    // no longer in the response must go back to a single default slot, not
    // stay stuck from a stale form.
    for (const day of this.weekDays) {
      const dayGroup = this.workingHoursForm.get(day.value)!;
      dayGroup.patchValue({ radi: false });
      const slots = this.slotsFor(day.value);
      slots.clear();
      slots.push(this.buildSlotGroup());
    }
    for (const entry of entries ?? []) {
      const dayGroup = this.workingHoursForm.get(entry.day);
      if (!dayGroup || !entry.slots?.length) continue;
      const slots = this.slotsFor(entry.day);
      slots.clear();
      for (const slot of entry.slots) {
        slots.push(this.buildSlotGroup(slot.from, slot.to));
      }
      dayGroup.patchValue({ radi: true });
    }
  }

  private buildWorkingHours(): EmployeeWorkingHoursEntry[] {
    const result: EmployeeWorkingHoursEntry[] = [];
    for (const day of this.weekDays) {
      const dayGroup = this.workingHoursForm.get(day.value)!;
      if (!dayGroup.get('radi')?.value) continue;
      const slots = this.slotsFor(day.value).value as { from: string; to: string }[];
      if (!slots.length) continue;
      result.push({ day: day.value, slots });
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
