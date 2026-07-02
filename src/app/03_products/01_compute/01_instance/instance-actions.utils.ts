import { firstValueFrom } from 'rxjs';
import { ProductInstance } from '@products/00_shared/models/product.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { StateService } from '@shared/services/state.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { CreateInstanceSnapshot } from '@products/00_shared/models/compute/instance-snapshot/create-instance-snapshot.model';
import {
  InstanceSnapshotCreateDialogComponent,
  InstanceSnapshotCreateResultDialog,
} from '@products/01_compute/02_instance_snapshot/instance-snapshot-create-dialog/instance-snapshot-create-dialog.component';

export class InstanceActions {
  static async startInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(instanceSvc.startVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid));
    }
  }

  static async stopInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(instanceSvc.stopVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid));
    }
  }

  static async stopForceInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(
        instanceSvc.stopForceVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
      );
    }
  }

  static async restartInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(
        instanceSvc.restartVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
      );
    }
  }

  static openSerial(stateSvc: StateService, az: string, instance: ProductInstance) {
    window.open(
      `${document.baseURI}terminal/${stateSvc.organization()!.id}/${stateSvc.project()!.id}/${az}/${instance.eid}`,
      '_blank',
      'popup=yes,height=620,width=780'
    );
  }

  static openVNC(stateSvc: StateService, az: string, instance: ProductInstance) {
    window.open(
      `${document.baseURI}vnc/${stateSvc.organization()!.id}/${stateSvc.project()!.id}/${az}/${instance.eid}`,
      '_blank',
      'popup=yes,height=620,width=780'
    );
  }

  static createSnapshot(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    snackbar: MatSnackBar,
    az: string,
    instance: ProductInstance
  ) {
    const ref = dialog.open(InstanceSnapshotCreateDialogComponent, {
      data: { instance: instance },
    });
    ref.afterClosed().subscribe((res: InstanceSnapshotCreateResultDialog) => {
      if (res && instance.eid) {
        const snapshot = new CreateInstanceSnapshot({
          general: {
            productName: res.name,
            source: instance.eid!,
          },
        });

        firstValueFrom(
          instanceSnapshotSvc.create(stateSvc.organization()!.id, stateSvc.project()!.id, az, snapshot)
        ).then(() => {
          snackbar.open('Snapshot created with success!', undefined, {
            horizontalPosition: 'end',
            duration: 3000,
          });
        });
      }
    });
  }

  static async openArgoCD(instanceSvc: InstanceService, stateSvc: StateService, az: string, instance: ProductInstance) {
    const res = await firstValueFrom(
      instanceSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
    );

    if (res) {
      window.open(res.link, '_blank');
    }
  }

  static deleteInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    instance: ProductInstance
  ): Promise<boolean> {
    if (az && instance.eid) {
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete ${instance.productName || instance.eid}`,
          html: `
        <p>Are you sure you want to permanently delete "${instance.productName || instance.eid}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting an instance is permanent and cannot be undone.</span>
        `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(
              instanceSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid!)
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
