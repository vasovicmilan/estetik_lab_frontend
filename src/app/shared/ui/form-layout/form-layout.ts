import { Component, input } from '@angular/core';

/**
 * CSS-grid-based responsive layout for admin forms, replacing each form's
 * current ad-hoc structure (a plain flex/block stack of `mat-form-field`s).
 * Fields auto-fit into columns of at least `columnMinWidth` and collapse to a
 * single column on narrow viewports.
 *
 * Plain usage (all fields in one grid, no sections):
 * ```html
 * <form [formGroup]="form" (ngSubmit)="submit()">
 *   <app-form-layout>
 *     <mat-form-field appearance="outline">
 *       <mat-label>Naziv</mat-label>
 *       <input matInput formControlName="name" />
 *     </mat-form-field>
 *     <mat-form-field appearance="outline">
 *       <mat-label>SKU</mat-label>
 *       <input matInput formControlName="sku" />
 *     </mat-form-field>
 *   </app-form-layout>
 *   <app-form-actions [saving]="saving()" cancelRoute="/admin/prodavnica" />
 * </form>
 * ```
 *
 * With labeled sections (mirrors the backend's `sectionTitle` divider idea -
 * an optional heading between groups of fields in the same form):
 * ```html
 * <app-form-layout>
 *   <app-form-section title="Osnovni podaci">
 *     <mat-form-field appearance="outline"> ... </mat-form-field>
 *   </app-form-section>
 *   <app-form-section title="SEO">
 *     <mat-form-field appearance="outline"> ... </mat-form-field>
 *   </app-form-section>
 * </app-form-layout>
 * ```
 *
 * `columnMinWidth` tunes the `minmax()` floor per form when the default
 * (260px, matching `product-list__grid`'s existing convention) doesn't fit a
 * particular field set (e.g. a form with mostly short fields can go narrower).
 */
@Component({
  selector: 'app-form-layout',
  imports: [],
  templateUrl: './form-layout.html',
  styleUrl: './form-layout.scss',
})
export class FormLayout {
  columnMinWidth = input<string>('260px');
}
