import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Template context handed to a custom cell template - `let row` (implicit) or `let-row="row"`
 * both work. */
export interface DataTableCellContext<T> {
  $implicit: T;
  row: T;
}

/**
 * Structural escape hatch for a 'custom' DataTableColumn: a parent projects
 * `<ng-template appDataTableCellDef="columnKey" let-row>...</ng-template>` into
 * <app-data-table>, and DataTable looks it up by columnKey to render that column's
 * cells (both in the mat-table and in the stacked mobile card view) - see the
 * usage example atop data-table.ts.
 */
@Directive({ selector: 'ng-template[appDataTableCellDef]' })
export class DataTableCellDef<T = unknown> {
  readonly templateRef = inject<TemplateRef<DataTableCellContext<T>>>(TemplateRef);

  /** The DataTableColumn.key this template renders. */
  readonly key = input.required<string>({ alias: 'appDataTableCellDef' });

  static ngTemplateContextGuard<T>(_dir: DataTableCellDef<T>, ctx: unknown): ctx is DataTableCellContext<T> {
    return true;
  }
}
