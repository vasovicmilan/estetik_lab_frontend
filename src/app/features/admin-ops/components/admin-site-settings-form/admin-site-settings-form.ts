import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { AdminSiteSettings } from '../../services/site-settings';
import { SiteSettings } from '../../models/site-settings';

/** Single settings form - hero image + alt, booking policy (minutes/hours),
 * currency, minimum session commission. One "Sačuvaj" button, no wizard.
 * Hero image upload follows the exact same "upload then reference" flow as
 * admin-business-partner-form's onImageSelected() (see that component's
 * header comment), just pointed at upload type "site". The PUT response only
 * carries bookingPolicy/currency/commissionPolicy (see SiteSettingsPolicyUpdate's
 * comment), so after a successful save the hero fields already held locally
 * are merged back in rather than re-fetching GET. Mounted at
 * /admin/podesavanja-sajta. */
@Component({
  selector: 'app-admin-site-settings-form',
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, ImageUrlPipe],
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
}
