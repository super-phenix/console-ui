import { firstValueFrom } from 'rxjs';
import { ProductDisk } from '@products/00_shared/models/product.model';
import { DiskService } from '@products/00_shared/services/disk.service';
import { StateService } from '@shared/services/state.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { RESOURCE_LOCAL_ID_LABEL_KEY } from '@shared/models/consts';
import { v5 as uuidv5 } from 'uuid';

export function redirectToParentKaas(
  router: Router,
  az: string | undefined,
  disk: ProductDisk
): void {
  if (!az) {
    return;
  }

  const labels = disk.disk?.metadata?.labels ?? disk.pvc?.metadata?.labels;
  const rawLocalId = labels?.[RESOURCE_LOCAL_ID_LABEL_KEY];
  if (!rawLocalId) {
    return;
  }

  const uuidMatch = rawLocalId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (!uuidMatch) {
    return;
  }
  const uuid = uuidMatch[0];

  const { projectId } = getProductLabelInfo(labels);
  if (!projectId) {
    return;
  }

  const effectiveId = 'spx-' + uuidv5(uuid, projectId);
  const url = router.serializeUrl(router.createUrlTree(['/products', 'paas', 'kaas', 'details', az, effectiveId]));
  window.open(url, '_blank');
}

export class DiskActions {
  static redirectToParentKaas = redirectToParentKaas;

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
