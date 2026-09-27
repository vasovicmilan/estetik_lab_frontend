import { Component, TemplateRef, computed, contentChildren, effect, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ImageUrlPipe } from '../../../core/pipes/image-url-pipe';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import { DataTableAction, DataTableColumn } from './data-table.models';
import { DataTableCellDef } from './data-table-cell-def';

/**
 * Generic, config-driven admin list table. Presentational only - it renders rows,
 * paging, sorting UI and row actions, but the parent still owns fetching (each admin
 * list talks to a different Api.getList() endpoint) and, for sortChange, re-fetching
 * in sorted order (see DataTableColumn.sortable's doc: sorting is never done client-side).
 *
 * Usage example (mirrors admin-product-list's existing load()/onPage()/remove() pattern -
 * only the template changes):
 *
 * ```ts
 * columns: DataTableColumn<ProductAdminListItem>[] = [
 *   { key: 'slika', label: '', type: 'custom' },
 *   { key: 'naziv', label: 'Naziv', sortable: true },
 *   { key: 'kategorije', label: 'Kategorije', value: (row) => row.kategorije.join(', ') },
 *   { key: 'cena', label: 'Cena', sortable: true },
 * ];
 * actions: DataTableAction<ProductAdminListItem>[] = [
 *   { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/prodavnica', row.id, 'pregled']) },
 *   { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/prodavnica', row.id]) },
 *   { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati proizvod?', onClick: (row) => this.remove(row) },
 * ];
 *
 * onSort(sort: Sort): void {
 *   this.sort = sort.direction ? sort : null;
 *   this.load(1);
 * }
 * ```
 *
 * ```html
 * <app-data-table
 *   [columns]="columns"
 *   [rows]="rows()"
 *   [loading]="loading()"
 *   [error]="error()"
 *   [totalCount]="meta()?.total ?? 0"
 *   [pageSize]="meta()?.limit ?? 10"
 *   [pageIndex]="(meta()?.page ?? 1) - 1"
 *   [actions]="actions"
 *   searchable
 *   (pageChange)="onPage($event)"
 *   (searchChange)="onSearch($event)"
 *   (sortChange)="onSort($event)"
 *   (retry)="load(meta()?.page ?? 1)"
 * >
 *   <ng-template appDataTableCellDef="slika" let-row>
 *     @if (row.slika?.url) {
 *       <img [src]="row.slika.url | imageUrl" alt="" width="48" height="48" />
 *     }
 *   </ng-template>
 * </app-data-table>
 * ```
 *
 * A page-level "create new" button (e.g. admin-product-list's "Novi proizvod" link) is
 * left to the parent's own template, placed above <app-data-table> exactly as today -
 * DataTable has no createLabel/createRoute input, to avoid duplicating that placement.
 */
@Component({
  selector: 'app-data-table',
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    ImageUrlPipe,
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T> {
  private confirmDialog = inject(ConfirmDialogService);
  private breakpointObserver = inject(BreakpointObserver);

  columns = input<DataTableColumn<T>[]>([]);
  rows = input<T[]>([]);
  loading = input(false);
  error = input<string | null>(null);
  emptyLabel = input('Nema podataka.');

  totalCount = input(0);
  pageSize = input(10);
  pageIndex = input(0);
  /** Options offered in the paginator's page-size dropdown. The current
   * `pageSize()` is always folded into the effective list (see
   * `effectivePageSizeOptions`) even if a parent passes a custom default
   * that isn't one of these - `mat-paginator` warns/misbehaves otherwise. */
  pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  /** Column `key` + direction to show as already-sorted on first render (e.g.
   * the API's own default order), so the header's sort arrow reflects reality
   * instead of looking unsorted until the user clicks something. Omit for no
   * default sort indicator. */
  defaultSort = input<{ active: string; direction: 'asc' | 'desc' } | undefined>(undefined);

  searchable = input(false);
  searchPlaceholder = input('Pretraga...');

  actions = input<DataTableAction<T>[]>([]);

  pageChange = output<PageEvent>();
  searchChange = output<string>();
  sortChange = output<Sort>();
  /** Emitted when the "Pokušaj ponovo" button is clicked in the error state - the
   * parent re-runs whatever load(page) it was already using. */
  retry = output<void>();

  /** `pageSizeOptions()` plus the current `pageSize()`, deduped and sorted -
   * guarantees the paginator's selected value is always one of its own
   * offered options. */
  effectivePageSizeOptions = computed(() => {
    const options = new Set(this.pageSizeOptions());
    options.add(this.pageSize());
    return [...options].sort((a, b) => a - b);
  });

  private cellTemplateDefs = contentChildren(DataTableCellDef);

  /** The table's own `MatSort` instance (only present once the non-stacked
   * `<table>` branch is actually rendered - `undefined` in the stacked/mobile
   * card layout, and briefly `undefined` right after the layout flips back). */
  private matSort = viewChild(MatSort);

  /** Below this width, swap the mat-table for a stacked mat-card-per-row layout.
   * 768px covers Material's Breakpoints.Handset and Breakpoints.TabletPortrait in one
   * simple query, rather than composing BreakpointObserver with both constants. */
  private isHandset = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)']).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  isStacked = computed(() => this.isHandset());

  displayedColumnKeys = computed(() => {
    const keys = this.columns().map((column) => column.key);
    return this.actions().length > 0 ? [...keys, '__actions'] : keys;
  });

  private search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => this.searchChange.emit(term));

    // Set the initial sort indicator imperatively (once, whenever the
    // `<table>` branch (re)mounts its own MatSort) instead of continuously
    // binding `[matSortActive]`/`[matSortDirection]` in the template: MatSort
    // treats `active`/`direction` as ordinary @Inputs, so a template binding
    // to `defaultSort()` (a value that never changes) gets *re-applied* by
    // Angular on every change-detection pass - including the one right after
    // the user clicks a sort header, which flips MatSort's active/direction
    // internally and emits `sortChange`. That re-application snapped the
    // sort arrow straight back to `defaultSort()`, so a click looked like it
    // did nothing even though `sortChange` (and the resulting reload) fired
    // correctly. Doing it here runs once per mount and never fights a
    // subsequent click.
    effect(() => {
      const sort = this.matSort();
      const initial = this.defaultSort();
      if (sort && initial) {
        sort.active = initial.active;
        sort.direction = initial.direction;
      }
    });
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  onPage(event: PageEvent): void {
    // A page-SIZE change (not just a page change) can leave pageIndex pointing
    // past the now-shorter list - reset to page 0 so every consumer gets this
    // for free instead of needing to remember it in their own pageChange handler.
    if (event.pageSize !== this.pageSize()) {
      this.pageChange.emit({ ...event, pageIndex: 0 });
      return;
    }
    this.pageChange.emit(event);
  }

  onSort(sort: Sort): void {
    // MatSort's own built-in 3-state cycle (asc -> desc -> '' -> asc -> ...,
    // since `disableClear` is left at its default `false`) already reverses
    // order on a second click with no extra work here. The third click clears
    // it back to direction: '' though, which - with no defaultSort() input -
    // is genuinely "unsorted" and left alone. But when the caller DID configure
    // a defaultSort() (the column that reflects the API's own natural order,
    // e.g. admin-product-list's `kreiran`/desc matching the backend's
    // `{ createdAt: -1 }` fallback), snapping back to a *blank* indicator on
    // that third click is misleading: the reload that follows lands back on
    // that exact same default order anyway (parents forward `sort ?? undefined`
    // to the API, which falls back to it), so the arrow should say so instead
    // of going blank. Re-point the clear at the default column/direction, both
    // in the emitted Sort (what the parent's load() acts on) and on the
    // MatSort instance itself (so the header arrow reflects it immediately,
    // instead of waiting for a defaultSort()-driven re-render that never comes
    // since that effect only fires once per mount).
    const initial = this.defaultSort();
    if (!sort.direction && initial) {
      const sortInstance = this.matSort();
      if (sortInstance) {
        sortInstance.active = initial.active;
        sortInstance.direction = initial.direction;
      }
      this.sortChange.emit({ active: initial.active, direction: initial.direction });
      return;
    }
    this.sortChange.emit(sort);
  }

  onRetry(): void {
    this.retry.emit();
  }

  templateFor(key: string): TemplateRef<unknown> | undefined {
    return this.cellTemplateDefs().find((def) => def.key() === key)?.templateRef;
  }

  cellValue(row: T, column: DataTableColumn<T>): unknown {
    return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
  }

  imageSrc(row: T, column: DataTableColumn<T>): string | null | undefined {
    return this.cellValue(row, column) as string | null | undefined;
  }

  dateValue(row: T, column: DataTableColumn<T>): string | number | Date | null | undefined {
    return this.cellValue(row, column) as string | number | Date | null | undefined;
  }

  visibleActions(row: T): DataTableAction<T>[] {
    return this.actions().filter((action) => !action.visible || action.visible(row));
  }

  runAction(action: DataTableAction<T>, row: T): void {
    if (action.confirm) {
      this.confirmDialog.confirm({ message: action.confirm }).subscribe((confirmed) => {
        if (confirmed) action.onClick(row);
      });
    } else {
      action.onClick(row);
    }
  }
}
