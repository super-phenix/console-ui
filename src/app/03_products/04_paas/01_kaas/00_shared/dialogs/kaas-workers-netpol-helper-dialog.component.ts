import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

@Component({
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  template: `
    <h2 mat-dialog-title>Workers Network Policies</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <div>
        <h2>None</h2>
        <span>
          Don't create any policies. Apply user-defined security group rules.<br />
          Custom rules need to accommodate for cluster requirements.<br />
          <br />
          Worker nodes need to have internet access and can be targeted via the label:<br />
          <code>cluster.x-k8s.io/cluster-name: &#60;clusterID&#62;</code>
        </span>
      </div>

      <div>
        <h2>Strict</h2>
        <span>
          Create restrictive policies to allow only necessary connections. Isolate nodes from the rest of the subnet.
        </span>
      </div>

      <div>
        <h2>Default</h2>
        <span>No particular restriction. The proper functioning of the cluster is guaranteed.</span>
      </div>
    </div>
    <div mat-dialog-actions>
      <button type="button" matButton="filled" mat-dialog-close>Close</button>
    </div>
  `,
})
export class KaasWorkersNetpolHelperDialog {
  readonly dialogRef = inject(MatDialogRef<KaasWorkersNetpolHelperDialog>);
}
