import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { AdminSiteSettings } from '../../services/site-settings';
import { SiteSettings, SiteSettingsWeekDay } from '../../models/site-settings';
import { FormLayout } from '../../../../shared/ui/form-layout/form-layout';
import { FormSection } from '../../../../shared/ui/form-layout/form-section';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { DatePicker } from '../../../../shared/ui/date-picker/date-picker';

/** Single settings form - hero image + alt, booking policy (minutes/hours),
 * currency, minimum session commission. One "Sačuvaj" button, no wizard.
 * Hero image upload follows the exact same "upload then reference" flow as
 * admin-business-partner-form's onImageSelected() (see that component's
 * header comment), just pointed at upload type "site". The PUT response only
 * carries bookingPolicy/currency/commissionPolicy (see SiteSettingsPolicyUpdate's
 * comment), so after a successful save the hero fields already held locally
 * are merged back in rather than re-fetching GET. Mounted at
 * /admin/podesavanja-sajta.
 *
 * Two extra sections, each its own form + save button + PUT endpoint (NOT
 * part of the main submit() above):
 * - Radno vreme: the salon-wide DISPLAY schedule (kontakt/footer/SEO JSON-LD)
 *   - fixed 7-day table, same pattern as admin-employee-form's weekDays, but
 *   simpler (one open/close range per day, no shift-block FormArray) since
 *   this is purely informational and NEVER touches Employee.workingHours or
 *   real booking-slot availability.
 * - Neradni dani: one-off closures/praznici (FormArray, add/remove rows) - a
 *   hard, salon-wide override for booking availability, checked before any
 *   individual employee's own schedule (see availability.service.js). */
@Component({
  selector: 'app-admin-site-settings-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ImageUrlPipe,
    FormLayout,
    FormSection,
    FormActions,
    DatePicker,
  ],
  templateUrl: './admin-site-settings-form.html',
  styleUrl: './admin-site-settings-form.scss',
})
export class AdminSiteSettingsForm implements OnInit {
  private fb = inject(FormBuilder);
  private siteSettings = inject(AdminSiteSettings);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  uploadingImage = signal(false);
  savingWorkingHours = signal(false);
  savingClosedDates = signal(false);

  /** Fixed 7 rows (Monday-Sunday), same "hardcoded Serbian labels" convention
   * as admin-employee-form's weekDays. This is the salon-wide DISPLAY
   * schedule only (kontakt/footer/SEO) - NOT Employee.workingHours, which
   * stays edited on the employee form and keeps driving real booking-slot
   * availability untouched. */
  weekDays: { value: SiteSettingsWeekDay; label: string }[] = [
    { value: 'monday', label: 'Ponedeljak' },
    { value: 'tuesday', label: 'Utorak' },
    { value: 'wednesday', label: 'Sreda' },
    { value: 'thursday', label: 'Četvrtak' },
    { value: 'friday', label: 'Petak' },
    { value: 'saturday', label: 'Subota' },
    { value: 'sunday', label: 'Nedelja' },
  ];

  /** Keyed by day (not user-addable, always all 7 - the backend rejects
   * anything else), one open/close range each - much simpler than
   * admin-employee-form's per-day FormArray of slots, since this schedule has
   * no shift-block concept. */
  workingHoursForm: FormGroup = this.fb.group(
    Object.fromEntries(
      this.weekDays.map((d) => [
        d.value,
        this.fb.group({
          isOpen: [false],
          from: ['09:00'],
          to: ['20:00'],
        }),
      ])
    )
  );

  /** Add/remove rows freely - a full replace is sent on save (see
   * SiteSettingsClosedDatesUpdatePayload's comment). */
  closedDatesForm: FormArray = this.fb.array([]) as FormArray;

  get closedDateGroups(): FormGroup[] {
    return this.closedDatesForm.controls as FormGroup[];
  }

  private buildClosedDateGroup(date: Date | null = null, reason = '', recurringYearly = false): FormGroup {
    return this.fb.group({
      date: [date as Date | null, Validators.required],
      reason: [reason, Validators.maxLength(200)],
      recurringYearly: [recurringYearly],
    });
  }

  addClosedDate(): void {
    this.closedDatesForm.push(this.buildClosedDateGroup());
  }

  removeClosedDate(index: number): void {
    this.closedDatesForm.removeAt(index);
  }

  /** The currently-known hero image path, used both as the preview and as
   * the fallback merged back in after a save (see header comment). */
  heroImage = signal<string | null>(null);

  currencyPositionOptions: { value: 'before' | 'after'; label: string }[] = [
    { value: 'before', label: 'Ispred iznosa' },
    { value: 'after', label: 'Iza iznosa' },
  ];

  form: FormGroup = this.fb.group({
    heroImageAlt: ['', Validators.maxLength(200)],
    bufferMinutes: [0, [Validators.required, Validators.min(0)]],
    slotGridMinutes: [0, [Validators.required, Validators.min(1)]],
    userCancellationCutoffHours: [0, [Validators.required, Validators.min(0)]],
    rescheduleCutoffHours: [0, [Validators.required, Validators.min(0)]],
    rescheduleSameDayFloorHours: [0, [Validators.required, Validators.min(0)]],
    rescheduleMinLeadMinutes: [0, [Validators.required, Validators.min(0)]],
    currencyCode: ['', Validators.required],
    currencySymbol: ['', Validators.required],
    currencySymbolPosition: ['after' as 'before' | 'after', Validators.required],
    minimumSessionCommission: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.siteSettings
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settings) => this.patchForm(settings),
        error: (error) => this.snackBar.open(error?.message || 'Greška pri učitavanju podešavanja sajta.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(settings: SiteSettings): void {
    this.heroImage.set(settings.hero.image);
    this.form.patchValue({
      heroImageAlt: settings.hero.imageAlt ?? '',
      bufferMinutes: settings.bookingPolicy.bufferMinutes,
      slotGridMinutes: settings.bookingPolicy.slotGridMinutes,
      userCancellationCutoffHours: settings.bookingPolicy.userCancellationCutoffHours,
      rescheduleCutoffHours: settings.bookingPolicy.rescheduleCutoffHours,
      rescheduleSameDayFloorHours: settings.bookingPolicy.rescheduleSameDayFloorHours,
      rescheduleMinLeadMinutes: settings.bookingPolicy.rescheduleMinLeadMinutes,
      currencyCode: settings.currency.code,
      currencySymbol: settings.currency.symbol,
      currencySymbolPosition: settings.currency.symbolPosition,
      minimumSessionCommission: settings.commissionPolicy.minimumSessionCommission,
    });

    for (const entry of settings.workingHours ?? []) {
      this.workingHoursForm.get(entry.day)?.patchValue({ isOpen: entry.isOpen, from: entry.from, to: entry.to });
    }

    this.closedDatesForm.clear();
    for (const entry of settings.closedDates ?? []) {
      // stored/returned as a full ISO datetime - only the date part is
      // editable here (app-date-picker's value is a plain Date | null, same
      // conversion convention as admin-coupon-form's validFrom/validUntil).
      const dateOnly = entry.date ? new Date(entry.date.slice(0, 10)) : null;
      this.closedDatesForm.push(this.buildClosedDateGroup(dateOnly, entry.reason ?? '', !!entry.recurringYearly));
    }
  }

  /** New reference set only when a new file is picked - unset stays whatever
   * was already stored. */
  private newHeroImg: string | null = null;

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.siteSettings
      .uploadHeroImage(file)
      .pipe(finalize(() => this.uploadingImage.set(false)))
      .subscribe({
        next: (reference) => {
          this.newHeroImg = reference.img;
          this.heroImage.set(reference.img);
        },
        error: () => this.snackBar.open('Upload slike nije uspeo.', 'U redu', { duration: 4000 }),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.saving.set(true);
    this.siteSettings
      .update({
        heroImage: this.newHeroImg ? { img: this.newHeroImg } : undefined,
        heroImageAlt: raw.heroImageAlt ?? '',
        bufferMinutes: raw.bufferMinutes,
        slotGridMinutes: raw.slotGridMinutes,
        userCancellationCutoffHours: raw.userCancellationCutoffHours,
        rescheduleCutoffHours: raw.rescheduleCutoffHours,
        rescheduleSameDayFloorHours: raw.rescheduleSameDayFloorHours,
        rescheduleMinLeadMinutes: raw.rescheduleMinLeadMinutes,
        currencyCode: raw.currencyCode,
        currencySymbol: raw.currencySymbol,
        currencySymbolPosition: raw.currencySymbolPosition,
        minimumSessionCommission: raw.minimumSessionCommission,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.newHeroImg = null;
          this.snackBar.open('Podešavanja sajta su sačuvana.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  /** Separate save (own PUT endpoint, own button) from the main form above -
   * a working-hours table doesn't belong in the same submit as the hero
   * image/booking policy, same reasoning as site-settings.routes.js's own
   * separate "/radno-vreme" route. Always sends the full 7-day list, in the
   * fixed weekDays order, since that's what the backend requires. */
  saveWorkingHours(): void {
    if (this.workingHoursForm.invalid) {
      this.workingHoursForm.markAllAsTouched();
      return;
    }

    const workingHours = this.weekDays.map((d) => {
      const raw = this.workingHoursForm.get(d.value)!.getRawValue();
      return { day: d.value, isOpen: raw.isOpen, from: raw.from, to: raw.to };
    });

    this.savingWorkingHours.set(true);
    this.siteSettings
      .updateWorkingHours({ workingHours })
      .pipe(finalize(() => this.savingWorkingHours.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Radno vreme je sačuvano.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje radnog vremena nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  /** Separate save (own PUT endpoint, own button) for the one-off closed-
   * dates/praznici list - a full replace of whatever rows are currently in
   * the form. */
  saveClosedDates(): void {
    if (this.closedDatesForm.invalid) {
      this.closedDatesForm.markAllAsTouched();
      return;
    }

    const closedDates = this.closedDatesForm.getRawValue().map((entry: { date: Date | null; reason: string; recurringYearly: boolean }) => ({
      ...entry,
      date: entry.date?.toISOString().slice(0, 10) ?? '',
    }));

    this.savingClosedDates.set(true);
    this.siteSettings
      .updateClosedDates({ closedDates })
      .pipe(finalize(() => this.savingClosedDates.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Neradni dani su sačuvani.', 'U redu', { duration: 3000 }),
        error: (error) => this.snackBar.open(error?.message || 'Čuvanje neradnih dana nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
