import { firstValueFrom } from 'rxjs';
import { StateService } from '@shared/services/state.service';
import { SnapshotService } from '@products/00_shared/services/snapshot.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { ProductSnapshot } from '@products/00_shared/models/product.model';

export class SnapshotActions {
  static async openArgoCD(snapshotSvc: SnapshotService, stateSvc: StateService, snapshot: ProductSnapshot) {
    if (snapshot.gitops === 'true') {
      const res = await firstValueFrom(
        snapshotSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, snapshot.codeAZ!, snapshot.eid)
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteSnapshot(
    snapshotSvc: SnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    snapshot: ProductSnapshot
  ): Promise<boolean> {
    if (snapshot.codeAZ) {
      const name = snapshot.productName ? snapshot.productName : snapshot.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete Snapshot`,
          html: `
          <p>Are you sure you want to permanently delete "${name}"?</p>
          <span class="color-warn"><strong>Warning:</strong> Deleting a snapshot is permanent and cannot be undone.</span>
          `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(
              snapshotSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, snapshot.codeAZ!, snapshot.eid!)
            ).then(() => resolve(true));
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }
}
