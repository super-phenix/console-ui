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

export interface InstanceSnapshotRestoreDataDialog {
  name: string;
  showForm: boolean;
}

export interface InstanceSnapshotRestoreResultDialog {
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
    <h2 mat-dialog-title>Restore a snapshot</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <!-- Instance not existing -->
      @if (data.showForm) {
        <span>The instance you are trying to restore no longer exists, it will be recreated.</span>
        <br />
        <span>Please enter the name for the instance.</span>

        <form class="dialog-form">
          <mat-form-field class="w-100">
            <mat-label>Instance name</mat-label>
            <input matInput type="text" autocomplete="off" [formControl]="nameControl" />
            <mat-hint align="end"> {{ nameControl.getRawValue()?.length }} / 63 </mat-hint>
            @if (nameControl.hasError('required')) {
              <mat-error>This field is required</mat-error>
            }
          </mat-form-field>
        </form>
      } @else {
        <div class="d-flex flex-column">
          <span>
            The instance "{{ data.name }}" still exists. After the restore, it will be overwritten and replaced by the
            snapshot version.
          </span>
          <br />
          <span>Are you sure you want to restore this snapshot?</span>
        </div>
      }
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" [disabled]="!nameControl.valid" (click)="restore()">Restore</button>
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
export class InstanceSnapshotRestoreDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InstanceSnapshotRestoreDialogComponent>);
  data: InstanceSnapshotRestoreDataDialog = inject(MAT_DIALOG_DATA);
  nameControl = new FormControl<string | undefined>(this.data.name, [Validators.required]);

  restore() {
    if (this.nameControl.valid) {
      this.dialogRef.close({
        name: this.nameControl.value,
      });
    }
  }
}
