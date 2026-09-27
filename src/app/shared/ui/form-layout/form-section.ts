import { Component, input } from '@angular/core';

/**
 * An optional labeled group of fields inside `FormLayout`, mirroring the
 * backend's `sectionTitle` divider concept: a heading followed by its own
 * group of fields, still laid out in the parent's single grid (the host is
 * `display: contents`, so its projected fields become direct grid items of
 * `app-form-layout` rather than a nested grid).
 *
 * Usage: see `FormLayout`'s header comment.
 */
@Component({
  selector: 'app-form-section',
  imports: [],
  templateUrl: './form-section.html',
  styleUrl: './form-section.scss',
})
export class FormSection {
  title = input<string | undefined>(undefined);
}
