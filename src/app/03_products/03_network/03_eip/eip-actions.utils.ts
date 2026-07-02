import { firstValueFrom } from 'rxjs';
import { StateService } from '@shared/services/state.service';
import { EipService } from '@products/00_shared/services/eip.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';

export class EipActions {
  static async openArgoCD(eipSvc: EipService, stateSvc: StateService, az: string, eid: string) {
    const res = await firstValueFrom(
      eipSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)
    );

    if (res) {
      window.open(res.link, '_blank');
    }
  }

  static deleteEIP(
    eipSvc: EipService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    eid: string,
    productName: string
  ): Promise<boolean> {
    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete EIP`,
        html: `
        <p>Are you sure you want to permanently delete "${productName || eid}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting an EIP is permanent and cannot be undone.</span>
        `,
      },
    });
    return new Promise(resolve => {
      ref.afterClosed().subscribe(res => {
        if (res == true) {
          firstValueFrom(eipSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)).then(() =>
            resolve(true)
          );
        } else {
          resolve(false);
        }
      });
    });
  }
}
