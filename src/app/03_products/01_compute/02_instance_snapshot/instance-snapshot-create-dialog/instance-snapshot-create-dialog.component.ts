import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProductInstance } from '@products/00_shared/models/product.model';

export interface InstanceSnapshotCreateDataDialog {
  instance: ProductInstance;
}

export interface InstanceSnapshotCreateResultDialog {
  name: string;
}

@Component({
  selector: 'spx-instance-snapshot-create-dialog',
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
  templateUrl: './instance-snapshot-create-dialog.component.html',
  styleUrl: './instance-snapshot-create-dialog.component.scss',
})
export class InstanceSnapshotCreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InstanceSnapshotCreateDialogComponent>);
  data: InstanceSnapshotCreateDataDialog = inject(MAT_DIALOG_DATA);
  nameControl = new FormControl<string | undefined>(undefined, [Validators.required]);

  create() {
    if (this.nameControl.valid) {
      this.dialogRef.close({
        name: this.nameControl.value,
      });
    }
  }
}
