import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/**
 * Entry point for opening ConfirmDialog - wraps MatDialog.open() so call
 * sites don't have to repeat the width/data plumbing, and normalizes
 * afterClosed()'s `boolean | undefined` (undefined on backdrop/Escape
 * dismissal) down to a plain boolean. Replaces every native window.confirm()
 * call across the admin area.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data,
        width: '420px',
        maxWidth: '95vw',
        autoFocus: false,
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed ?? false));
  }
}
