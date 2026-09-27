/** How a column's raw value should be rendered. 'custom' hands rendering off entirely
 * to a parent-supplied <ng-template appDataTableCellDef="key"> (see data-table-cell-def.ts) -
 * every other type is drawn by DataTable itself. */
export type DataTableColumnType = 'text' | 'date' | 'badge' | 'image' | 'custom';

export interface DataTableColumn<T> {
  /** Property key on the row, and the id DataTable emits in sortChange/uses for matColumnDef
   * and for looking up a 'custom' column's <ng-template appDataTableCellDef="key">. */
  key: string;
  label: string;
  /** Defaults to 'text'. */
  type?: DataTableColumnType;
  /** Adds Material's mat-sort-header UI to this column's header. Sorting itself is NOT
   * done client-side - DataTable only emits sortChange, the parent re-fetches sorted
   * rows from the API (client-side sort would silently only sort the current page). */
  sortable?: boolean;
  /** How to pull this column's cell value off a row, when it isn't a plain `row[key]`
   * (e.g. a computed/nested value). Unused for 'custom' columns. */
  value?: (row: T) => unknown;
}

export type DataTableActionColor = 'primary' | 'accent' | 'warn';

export interface DataTableAction<T> {
  /** Material icon ligature name (Material Icons font, already linked in index.html). */
  icon: string;
  /** Used as the button's tooltip/aria-label - never shown as visible text. */
  label: string;
  color?: DataTableActionColor;
  /** Hide this action for rows that don't support it (e.g. can't delete a reserved role). */
  visible?: (row: T) => boolean;
  /** When set, DataTable itself opens ConfirmDialogService.confirm({ message: confirm })
   * and only calls onClick if the user confirms - callers no longer need to wire their
   * own confirm dialog for row actions (bulk actions / detail-page deletes still do). */
  confirm?: string;
  onClick: (row: T) => void;
}
