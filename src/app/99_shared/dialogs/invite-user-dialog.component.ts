import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatSelectModule } from '@angular/material/select';

export interface InviteUserDialogData {
  inviteCode: string;
  groups: string[];
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title>Invite a user</h2>
    <div mat-dialog-content class="d-flex flex-column gap-2">
      <span> Please enter the user code of the new owner: </span>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>User code</mat-label>
          <input matInput type="text" autocomplete="off" formControlName="inviteCode" />
          @if (form.controls['inviteCode'].hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field class="w-100">
          <mat-label>Groups</mat-label>
          <mat-select formControlName="groups" multiple>
            @for (group of data.groups; track $index) {
              <mat-option [value]="group.id">{{ group.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls['groups'].hasError('required')) {
            <mat-error>This field is required</mat-error>
          }
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!form.valid" (click)="invite()">
        Invite
      </button>
    </div>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;

      padding-block: 0.75rem;
      min-width: 400px;
    }
  `,
})
export class InviteUserDialog {
  private formBuilder = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<InviteUserDialog>);
  data = inject(MAT_DIALOG_DATA);

  form = this.formBuilder.group({
    inviteCode: new FormControl(undefined, Validators.required),
    groups: new FormControl(undefined, Validators.required),
  });

  invite() {
    if (this.form.valid) {
      const res = this.form.value;
      this.dialogRef.close(res);
    }
  }
}
