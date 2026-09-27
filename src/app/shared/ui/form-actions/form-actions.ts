import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/**
 * Standardized save/cancel footer for admin forms, matching the
 * "Sačuvaj" / "Čuvanje..." save-button convention already used identically
 * across the existing forms (see admin-product-form) and adding a Cancel
 * button, which 16 of the app's 17 forms currently lack entirely.
 *
 * Must be placed inside the `<form>` element (the save button is a plain
 * `type="submit"`, wired the same way every existing form already wires its
 * save button - no `save`/`cancel` output events to bind, just `[disabled]`
 * and `[routerLink]`, matching this codebase's convention rather than
 * reinventing event wiring):
 * ```html
 * <form [formGroup]="form" (ngSubmit)="submit()">
 *   ...
 *   <app-form-actions
 *     [saving]="saving()"
 *     [saveDisabled]="saving() || form.invalid"
 *     cancelRoute="/admin/prodavnica"
 *   />
 * </form>
 * ```
 *
 * `cancelRoute` also accepts a router commands array (`[cancelRoute]="['/admin', 'prodavnica']"`).
 * Omit it to hide the cancel button (e.g. for a form with no obvious "back to list" route).
 */
@Component({
  selector: 'app-form-actions',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './form-actions.html',
  styleUrl: './form-actions.scss',
})
export class FormActions {
  saving = input(false);
  saveDisabled = input(false);
  saveLabel = input('Sačuvaj');
  savingLabel = input('Čuvanje...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancelRoute = input<string | any[] | null>(null);
  cancelLabel = input('Otkaži');
}
