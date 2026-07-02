import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAX_NAME_LENGTH } from '@shared/models/consts';
import { noWhitespaceValidator } from '@shared/utils/validators';

@Component({
  selector: 'spx-create-organization-dialog',
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
    <h2 mat-dialog-title>Create an organization</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span> Please provide the organization details: </span>
      <form class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>Organization name</mat-label>
          <input matInput type="text" autocomplete="off" [formControl]="control" [maxlength]="maxLength" />
          <mat-hint align="end"> {{ control.getRawValue()?.length }} / {{ maxLength }} </mat-hint>
          @if (control.hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
          @if (control.hasError('whitespace')) {
            <mat-error>The field cannot start or end with a space</mat-error>
          }
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!control.valid" (click)="create()">
        Create
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
export class CreateOrganizationDialog {
  readonly dialogRef = inject(MatDialogRef<CreateOrganizationDialog>);
  maxLength = MAX_NAME_LENGTH;
  control = new FormControl<string | undefined>(undefined, [Validators.required, noWhitespaceValidator]);

  create() {
    if (this.control.valid) {
      const res = this.control.value;
      this.dialogRef.close(res);
    }
  }
}
