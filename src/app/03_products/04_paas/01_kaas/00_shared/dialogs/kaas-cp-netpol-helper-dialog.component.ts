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
    <h2 mat-dialog-title>Control Plane Network Policies</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <div>
        <h2>None</h2>
        <span>
          Don't create any policies. Apply user-defined security group rules.<br />
          Custom rules need to accommodate for cluster requirements.<br />
          <i>
            Make sure to allow traffic to the control plane on ports 7442, 7443 and 7444, from the EIP attached to your
            node's subnet as well as any network you want to access the cluster from.
          </i>
          <br />
          The control plane can be targeted by the following labels: <br />
          <ul>
            <li><code>superphenix.net/resourceEffectiveID: &#60;clusterID&#62;</code></li>
            <li><code>superphenix.net/workloadClass: kaas-tenant-api-server </code></li>
          </ul>
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
export class KaasCPNetpolHelperDialog {
  readonly dialogRef = inject(MatDialogRef<KaasCPNetpolHelperDialog>);
}
