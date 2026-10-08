import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface InstanceSnapshotRestoreDataDialog {
  name: string;
}

@Component({
  selector: 'spx-instance-snapshot-restore-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Restore a snapshot</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <span>
        The instance "{{ data.name }}" still exists. After the restore, it will be overwritten and replaced by the
        snapshot version.
      </span>
      <br />
      <span>Are you sure you want to restore this snapshot?</span>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" [mat-dialog-close]="true">Restore</button>
    </div>
  `,
})
export class InstanceSnapshotRestoreDialogComponent {
  data: InstanceSnapshotRestoreDataDialog = inject(MAT_DIALOG_DATA);
}
