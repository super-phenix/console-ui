import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
} from '@angular/material/dialog';

export interface ConfirmData {
  title: string;
  content?: string;
  html?: string;
  confirmBtn: string;
  cancelBtn: string;
}

@Component({
  selector: 'spx-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="confirm-dialog d-flex flex-column">
      @if (data.content) {
        <span> {{ data.content }} </span>
      }
      @if (data.html) {
        <div [innerHTML]="data.html"></div>
      }
    </div>

    <mat-dialog-actions align="end">
      <button matButton="outlined" mat-dialog-close>{{ data.cancelBtn || 'Cancel' }}</button>
      <button matButton="filled" [mat-dialog-close]="true">
        {{ data.confirmBtn || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirm-dialog {
      padding-block: 0.75rem;
      min-width: 300px;
    }
  `,
})
export class ConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
