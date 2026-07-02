import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { DiskCreateFormComponent } from '../../../../02_storage/01_disk/disk-create-form/disk-create-form.component';

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
    DiskCreateFormComponent,
  ],
  template: `
    <h2 mat-dialog-title>Create a Disk</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <div class="dialog-form">
        <spx-disk-create-form
          [az]="data.az"
          [initName]="data.initName"
          (createFormChange)="updateForm($event)"></spx-disk-create-form>
      </div>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!diskForm()?.valid" (click)="create()">
        Add
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
export class InstanceCreateDiskFormDialog {
  readonly dialogRef = inject(MatDialogRef<InstanceCreateDiskFormDialog>);
  data = inject(MAT_DIALOG_DATA);

  diskForm: WritableSignal<FormGroup | undefined> = signal(undefined);

  updateForm($event: FormGroup) {
    this.diskForm.set($event);
  }

  create() {
    if (this.diskForm()?.valid) {
      const res = this.diskForm()?.value;
      this.dialogRef.close(res);
    }
  }
}
