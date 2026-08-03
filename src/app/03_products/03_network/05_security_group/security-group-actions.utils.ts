import { MatDialog } from '@angular/material/dialog';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

export class SecurityGroupActions {
  static async openArgoCD(sgSvc: SecurityGroupService, stateSvc: StateService, az: string, eid: string) {
    const res = await firstValueFrom(
      sgSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)
    );
    if (res) {
      window.open(res.link, '_blank');
    }
  }

  static deleteSecurityGroup(
    sgSvc: SecurityGroupService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    eid: string,
    productName: string
  ): Promise<boolean> {
    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete Security Group`,
        html: `
        <p>Are you sure you want to permanently delete "${productName || eid}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting a security group is permanent and cannot be undone.</span>
        `,
      },
    });
    return new Promise(resolve => {
      ref.afterClosed().subscribe(res => {
        if (res == true) {
          firstValueFrom(sgSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)).then(() =>
            resolve(true)
          );
        } else {
          resolve(false);
        }
      });
    });
  }
}
