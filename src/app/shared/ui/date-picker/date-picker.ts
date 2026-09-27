import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideSerbianDateAdapter } from './serbian-date-adapter';

/**
 * Thin `mat-datepicker` + `mat-form-field` wrapper implementing
 * `ControlValueAccessor`, so it drops into an existing reactive `FormGroup`
 * with `formControlName` exactly like `mat-select`/`mat-checkbox` already do
 * elsewhere in this codebase - no extra glue code at the call site. Displays
 * and parses dates as `dd.MM.yyyy` (see `serbian-date-adapter.ts`). The
 * control's value is a plain `Date | null`; convert to/from an ISO date
 * string at the service-call boundary the same way existing forms already do
 * for their `<input type="date">` fields (e.g. `admin-coupon-form`'s
 * `validFrom.slice(0, 10)` pattern), for example
 * `date?.toISOString().slice(0, 10) ?? null`.
 *
 * Usage - replacing a plain `<input type="date" formControlName="validFrom">`:
 * ```html
 * <app-date-picker formControlName="validFrom" label="Važi od" />
 * <app-date-picker formControlName="validUntil" label="Važi do" [min]="form.value.validFrom" />
 * ```
 */
@Component({
  selector: 'app-date-picker',
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [
    provideSerbianDateAdapter(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker implements ControlValueAccessor {
  label = input('Datum');
  placeholder = input('dd.mm.gggg.');
  min = input<Date | null>(null);
  max = input<Date | null>(null);

  protected value: Date | null = null;
  protected disabled = false;

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onDateChange(value: Date | null): void {
    this.value = value;
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
