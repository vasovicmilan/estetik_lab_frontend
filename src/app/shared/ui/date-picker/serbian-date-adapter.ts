import { Injectable, Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';

/**
 * `NativeDateAdapter` override that renders/parses dates as `dd.MM.yyyy`.
 *
 * The app has no date library dependency (checked `package.json` - no
 * date-fns/moment/luxon), and Angular Material's native adapter with
 * `MAT_DATE_LOCALE: 'sr-RS'` does NOT produce a clean `dd.MM.yyyy`: the `sr-RS`
 * `Intl.DateTimeFormat` locale appends a trailing period (`27.09.2026.`), which
 * this app's forms don't use anywhere else. So `format`/`parse` are
 * implemented directly against the `Date` object's own getters instead of
 * going through `Intl`, which sidesteps the locale quirk entirely and needs no
 * extra dependency.
 */
@Injectable()
export class SerbianDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    if (!this.isValid(date)) {
      throw Error('SerbianDateAdapter: Cannot format invalid date.');
    }
    const day = this.pad(date.getDate());
    const month = this.pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        const date = new Date(year, month, day);
        // Reject overflow (e.g. 31.02.2026) rather than silently rolling it
        // forward to a different date, same as a strict form validator would.
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date;
        }
        return this.invalid();
      }
    }
    return super.parse(value);
  }

  private pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}

/**
 * Registers the Serbian (`dd.MM.yyyy`) date adapter + locale for
 * `MatDatepickerModule`. Added once, globally, in `app.config.ts` (the app had
 * no `DateAdapter`/`MAT_DATE_LOCALE` provider anywhere before this) - `DatePicker`
 * also re-provides it locally so it renders correctly even if used somewhere
 * that doesn't go through the app's root providers (e.g. isolated tests).
 */
export function provideSerbianDateAdapter(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'sr-RS' },
    { provide: DateAdapter, useClass: SerbianDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ];
}
