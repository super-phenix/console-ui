import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { noWhitespaceValidator } from '@shared/utils/validators';

export interface TransferOrgDialogData {
  id: string;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  template: `
    <h2 mat-dialog-title>Organization Transfer</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span>
        <i> Transfer the organization along with all associated products, projects and information to another user. </i>
      </span>
      <br />
      <span> Please enter the user code of the new owner: </span>
      <form class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>User code</mat-label>
          <input matInput type="text" autocomplete="off" [formControl]="control" />
          @if (control.hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
          @if (control.hasError('whitespace')) {
            <mat-error>The field cannot start or end with a space</mat-error>
          }
        </mat-form-field>
      </form>
      <span class="color-error"><i>This action is permanent!</i></span>
    </div>
    <div mat-dialog-actions>
      <button type="button" matButton="outlined" mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!control.valid" (click)="transfer()">
        Transfer
      </button>
    </div>
  `,
  styles: `
    .dialog-form {
      padding-block: 0.75rem;
      min-width: 400px;
    }
  `,
})
export class TransferOrganizationDialog {
  readonly dialogRef = inject(MatDialogRef<TransferOrganizationDialog>);
  data = inject(MAT_DIALOG_DATA);

  control = new FormControl<string | undefined>(undefined, [Validators.required, noWhitespaceValidator]);

  transfer() {
    if (this.control.valid && this.control.value) {
      const res: TransferOrgDialogData = {
        id: this.control.value,
      };
      this.dialogRef.close(res);
    }
  }
}
