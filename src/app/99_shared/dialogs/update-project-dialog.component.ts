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
    <h2 mat-dialog-title>Edit a project</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span> Please enter the new project name: </span>
      <div class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>Project name</mat-label>
          <input matInput type="text" autocomplete="off" [formControl]="control" />
          @if (control.hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
          @if (control.hasError('whitespace')) {
            <mat-error>The field cannot start or end with a space</mat-error>
          }
        </mat-form-field>
      </div>
    </div>
    <div mat-dialog-actions>
      <button matButton="outlined" mat-dialog-close>Cancel</button>
      <button matButton="filled" color="primary" [disabled]="!control.valid" (click)="update()">Update</button>
    </div>
  `,
  styles: `
    .dialog-form {
      padding-block: 0.75rem;
      min-width: 400px;
    }
  `,
})
export class UpdateProjectDialog {
  readonly dialogRef = inject(MatDialogRef<UpdateProjectDialog>);
  data: { name: string } = inject(MAT_DIALOG_DATA);

  control = new FormControl<string | undefined>(this.data.name, [Validators.required, noWhitespaceValidator]);

  update() {
    if (this.control.valid) {
      const res = this.control.value;
      this.dialogRef.close(res);
    }
  }
}
