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

export interface InstanceSnapshotCloneDataDialog {
  name: string;
}

export interface InstanceSnapshotCloneResultDialog {
  name: string;
}

@Component({
  selector: 'spx-instance-snapshot-restore-dialog',
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
    <h2 mat-dialog-title>Clone snapshot</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span>Give a name for the new instance.</span>

      <form class="dialog-form">
        <mat-form-field class="w-100">
          <mat-label>Instance Name</mat-label>
          <input matInput type="text" autocomplete="off" [formControl]="nameControl" />
          <mat-hint align="end"> {{ nameControl.getRawValue()?.length }} / 63 </mat-hint>
          @if (nameControl.hasError('required')) {
            <mat-error>Field is required.</mat-error>
          }
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" [disabled]="!nameControl.valid" (click)="clone()">Clone</button>
    </div>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;

      min-width: 450px;
      padding-block: 0.75rem;
      margin-block: 0.5rem;
      gap: 0.5rem;
    }
  `,
})
export class InstanceSnapshotCloneDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InstanceSnapshotCloneDialogComponent>);
  data: InstanceSnapshotCloneDataDialog = inject(MAT_DIALOG_DATA);
  nameControl = new FormControl<string | undefined>(this.data.name, [Validators.required]);

  clone() {
    if (this.nameControl.valid) {
      this.dialogRef.close({
        name: this.nameControl.value,
      });
    }
  }
}
