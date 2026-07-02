import { firstValueFrom } from 'rxjs';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { StateService } from '@shared/services/state.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

export class DiskActions {
  static unmountDisk(
    diskSvc: DiskService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    disk: ProductDisk
  ): Promise<boolean> {
    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Unmount a disk`,
        html: `<span>Are you sure you want to unmount "${disk.productName || disk.eid}"?</span>`,
      },
    });
    return new Promise(resolve => {
      ref.afterClosed().subscribe(async res => {
        if (res === true) {
          await firstValueFrom(diskSvc.unmountDisk(stateSvc.organization()!.id, stateSvc.project()!.id, az, disk.eid!));
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  static createSnapshot(router: Router, az: string, disk: ProductDisk) {
    if (disk.eid) {
      router.navigate(['/products', 'storage', 'snapshot', 'create'], {
        queryParams: { az: az, diskEid: disk.eid },
      });
    }
  }

  static async openArgoCD(diskSvc: DiskService, stateSvc: StateService, az: string, disk: ProductDisk) {
    if (disk.gitops === 'true' && az && disk.eid) {
      const res = await firstValueFrom(
        diskSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, disk.eid)
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteDisk(
    diskSvc: DiskService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    disk: ProductDisk
  ): Promise<boolean> {
    if (az && disk.eid) {
      const name = disk.productName ? disk.productName : disk.eid;
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete disk`,
          html: `
        <p>Are you sure you want to permanently delete "${name}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting a disk is permanent and cannot be undone.</span>
        `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(diskSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, disk.eid!)).then(() =>
              resolve(true)
            );
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }
}
