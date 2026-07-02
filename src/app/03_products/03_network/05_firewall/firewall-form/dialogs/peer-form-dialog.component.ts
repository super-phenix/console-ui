import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Peer } from '@products/00_shared/models/common.model';
import { PeerFormComponent } from '../peer-form/peer-form.component';

export interface PeerFormDataDialog {
  peer?: Peer;
  title: string;
  action: string;
}

@Component({
  selector: 'spx-peer-form-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, PeerFormComponent],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="d-flex flex-column">
      <spx-peer-form [init]="data.peer" (peer)="updatePeer($event)"></spx-peer-form>
    </div>
    <div mat-dialog-actions>
      <button type="button" mat-stroked-button mat-dialog-close>Cancel</button>
      <button type="button" matButton="filled" color="primary" [disabled]="!peerValid()" (click)="sendForm()">
        {{ data.action }}
      </button>
    </div>
  `,
})
export class PeerFormDialog {
  readonly dialogRef = inject(MatDialogRef<PeerFormDialog>);

  data: PeerFormDataDialog = inject(MAT_DIALOG_DATA);

  peer = signal<Peer | undefined>(this.data.peer);

  peerValid = computed(() => {
    const res = this.peer();
    if (!res) {
      return false;
    }

    if (res.ipBlock?.cidr) {
      return true;
    }

    if (res.podSelector) {
      if (res.podSelector.matchLabels && res.podSelector.matchLabels.length > 0) {
        return true;
      }
      if (res.podSelector.matchExpressions && res.podSelector.matchExpressions.length > 0) {
        return true;
      }
    }

    return false;
  });

  updatePeer(peer: Peer) {
    this.peer.set(peer);
  }

  sendForm() {
    if (this.peer() && this.peerValid()) {
      // Form validation
      const res = this.peer()!;

      this.dialogRef.close(res);
    }
  }
}
