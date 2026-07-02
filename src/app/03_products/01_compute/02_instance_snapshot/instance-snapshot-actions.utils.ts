import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProductInstanceSnapshot } from '@products/00_shared/models/product.model';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { StateService } from '@shared/services/state.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import {
  InstanceSnapshotRestoreDialogComponent,
  InstanceSnapshotRestoreResultDialog,
} from './instance-snapshot-restore-dialog.component';
import {
  InstanceSnapshotCloneDialogComponent,
  InstanceSnapshotCloneResultDialog,
} from './instance-snapshot-clone-dialog.component';

export class InstanceSnapshotActions {
  static restoreSnapshot(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    router: Router,
    az: string,
    snapshot: ProductInstanceSnapshot,
    instanceName?: string,
    instanceId?: string
  ) {
    if (az && snapshot.eid) {
      const ref = dialog.open(InstanceSnapshotRestoreDialogComponent, {
        data: {
          name: instanceName || snapshot.productName,
          showForm: !instanceName,
        },
      });
      ref.afterClosed().subscribe((res: InstanceSnapshotRestoreResultDialog) => {
        if (res && res.name) {
          const finalName = instanceName || res.name;
          const finalLocalId = instanceId || snapshot.vmSnapshotContent?.vm.localId || '';

          firstValueFrom(
            instanceSnapshotSvc.restore(
              stateSvc.organization()!.id,
              stateSvc.project()!.id,
              az,
              snapshot.eid!,
              finalName,
              finalLocalId
            )
          ).then(() => router.navigate(['/products', 'compute', 'instance']));
        }
      });
    }
  }

  static cloneSnapshot(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    router: Router,
    az: string,
    snapshot: ProductInstanceSnapshot,
    instanceName?: string
  ) {
    if (az && snapshot.eid) {
      const name = instanceName || snapshot.productName;
      const ref = dialog.open(InstanceSnapshotCloneDialogComponent, {
        data: {
          title: `Clone snapshot`,
          content: `Are you sure you want to clone "${name}" ?`,
        },
      });
      ref.afterClosed().subscribe((res: InstanceSnapshotCloneResultDialog) => {
        if (res && res.name) {
          firstValueFrom(
            instanceSnapshotSvc.clone(
              stateSvc.organization()!.id,
              stateSvc.project()!.id,
              az,
              snapshot.eid!,
              res.name
            )
          ).then(() => router.navigate(['/products', 'compute', 'instance']));
        }
      });
    }
  }

  static async openArgoCD(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    az: string,
    snapshot: ProductInstanceSnapshot
  ) {
    if (az && snapshot.eid && snapshot.gitops === 'true') {
      const res = await firstValueFrom(
        instanceSnapshotSvc.getArgoLink(
          stateSvc.organization()!.id,
          stateSvc.project()!.id,
          az,
          snapshot.eid
        )
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteSnapshot(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    snapshot: ProductInstanceSnapshot
  ): Promise<boolean> {
    if (az && snapshot.eid) {
      const name = snapshot.productName || snapshot.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete Snapshot`,
          html: `
        <p>Are you sure you want to permanently delete "${name}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting an instance snapshot is permanent and cannot be undone.</span>
        `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(
              instanceSnapshotSvc.delete(
                stateSvc.organization()!.id,
                stateSvc.project()!.id,
                az,
                snapshot.eid!
              )
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
