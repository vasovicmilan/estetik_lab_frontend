import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, Observable } from 'rxjs';
import { Employee } from '../../services/employee';
import { EmployeeEditPayload, EmployeeWeekDay, EmployeeWorkingHoursEntry } from '../../models/employee';
import { User } from '../../../users/services/user';
import { UserAdminListItem } from '../../../users/models/user';
import { Team } from '../../../team/services/team';
import { ExpertAdminListItem } from '../../../team/models/expert';
import { Service } from '../../../services-catalog/services/service';
import { ServiceListItem } from '../../../services-catalog/models/service';

/**
 * Create + edit, same pattern as admin-resource-form/admin-product-form: loads
 * the RAW edit shape (GET /admin/employees/:id/edit) when an id is present in
 * the route, otherwise starts blank for a new employee.
 *
 * userId is chosen from a `mat-select` populated by User.listAdmin({limit: 200})
 * (Part 1's Users feature) - a flat list, not search-as-you-type. Known v1
 * limitation: fine for a small salon staff pool, would need a real autocomplete
 * once the user base grows past a couple hundred. userId is REQUIRED on create
 * and not shown/editable at all once editing (validateEmployeeUpdate doesn't
 * accept it - see employee.ts's update() signature).
 *
 * Working hours: a simple weekly editor, one row per day (Monday-Sunday,
 * hardcoded Serbian labels), a checkbox "radi ovaj dan" revealing a FormArray
 * of from/to slot rows (add/remove), matching the backend's
 * EmployeeWorkingHoursEntry.slots[] shape 1:1 - multiple time ranges per day
 * (e.g. 09:00-13:00 and 16:00-20:00) are fully supported.
 *
 * workingHours is sent as part of the normal create/update payload (both
 * validators accept it directly) - the separate PUT .../working-hours endpoint
 * is not called from this form (see employee.ts's updateWorkingHours() comment).
 */
@Component({
  selector: 'app-admin-employee-form',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-employee-form.html',
  styleUrl: './admin-employee-form.scss',
})
export class AdminEmployeeForm implements OnInit {
  private fb = inject(FormBuilder);
  private employee = inject(Employee);
  private user = inject(User);
  private team = inject(Team);
  private service = inject(Service);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  employeeId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  optionsLoading = signal(false);

  userOptions = signal<UserAdminListItem[]>([]);
  expertOptions = signal<ExpertAdminListItem[]>([]);
  serviceOptions = signal<ServiceListItem[]>([]);

  payTypeOptions: { value: 'salary' | 'commission'; label: string }[] = [
    { value: 'salary', label: 'Fiksna plata' },
    { value: 'commission', label: 'Provizija' },
  ];

  weekDays: { value: EmployeeWeekDay; label: string }[] = [
    { value: 'monday', label: 'Ponedeljak' },
    { value: 'tuesday', label: 'Utorak' },
    { value: 'wednesday', label: 'Sreda' },
    { value: 'thursday', label: 'Četvrtak' },
    { value: 'friday', label: 'Petak' },
    { value: 'saturday', label: 'Subota' },
    { value: 'sunday', label: 'Nedelja' },
  ];

  form: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    expert: [''],
    services: [[] as string[]],
    payType: ['salary' as 'salary' | 'commission'],
    commissionRate: [null as number | null],
    isActive: [true],
    notes: ['', Validators.maxLength(500)],
    googleCalendarId: [''],
    sredimeIcsUrl: [''],
  });

  /** Top level keyed by day (fixed 7 rows, Monday-Sunday) - not user-addable.
   * Each day's `slots` IS a FormArray though, since a day can have any number
   * of time ranges (e.g. a lunch-break split shift). */
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

  get isCommission(): boolean {
    return this.form.get('payType')?.value === 'commission';
  }

  ngOnInit(): void {
    this.optionsLoading.set(true);
    forkJoin({
      users: this.user.listAdmin({ limit: 200 }),
      experts: this.team.listAdmin({ limit: 200 }),
      services: this.service.listAdmin({ limit: 200 }),
    })
      .pipe(finalize(() => this.optionsLoading.set(false)))
      .subscribe({
        next: ({ users, experts, services }) => {
          this.userOptions.set(users.data);
          this.expertOptions.set(experts.data);
          this.serviceOptions.set(services.data);
        },
        error: () => this.snackBar.open('Greška pri učitavanju opcija za formu.', 'U redu', { duration: 4000 }),
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.employeeId.set(id);
    this.loading.set(true);
    this.employee
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.patchForm(payload),
        error: () => this.snackBar.open('Greška pri učitavanju zaposlenog.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(payload: EmployeeEditPayload): void {
    this.form.patchValue({
      userId: payload.userId,
      expert: payload.expert ?? '',
      services: payload.services ?? [],
      payType: payload.payType ?? 'salary',
      commissionRate: payload.commissionRate ?? null,
      isActive: payload.isActive ?? true,
      notes: payload.notes ?? '',
      googleCalendarId: payload.googleCalendarId ?? '',
      sredimeIcsUrl: payload.sredimeIcsUrl ?? '',
    });
    // userId is fixed once an employee exists - lock the control instead of
    // hiding it, so the chosen user is still visible on the edit form.
    this.form.get('userId')?.disable();

    // Reset every row first - a previously-checked day (or extra slots) left
    // over from a prior patch must not stick around if this response no
    // longer includes it.
    for (const day of this.weekDays) {
      const dayGroup = this.workingHoursForm.get(day.value)!;
      dayGroup.patchValue({ radi: false });
      const slots = this.slotsFor(day.value);
      slots.clear();
      slots.push(this.buildSlotGroup());
    }
    for (const entry of payload.workingHours ?? []) {
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const workingHours = this.buildWorkingHours();
    const id = this.employeeId();

    this.saving.set(true);
    let request$: Observable<unknown>;
    if (id) {
      const { userId: _userId, ...updatePayload } = raw;
      request$ = this.employee.update(id, { ...updatePayload, workingHours });
    } else {
      request$ = this.employee.create({ ...raw, workingHours });
    }

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Zaposleni je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/zaposleni']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
