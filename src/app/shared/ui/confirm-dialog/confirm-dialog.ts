import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/** Data passed into ConfirmDialog via MatDialog.open()'s `data` option - see
 * ConfirmDialogService.confirm() for the intended entry point. */
export interface ConfirmDialogData {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Generic yes/no confirmation dialog, replacing native window.confirm() across
 * the admin area. Closes with `true` on confirm, `false` (or undefined, if
 * dismissed via backdrop/Escape) on cancel - ConfirmDialogService normalizes
 * that to a plain boolean Observable.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  private dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);

  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
