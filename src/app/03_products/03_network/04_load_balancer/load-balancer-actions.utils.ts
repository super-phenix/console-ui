import { firstValueFrom } from 'rxjs';
import { LoadBalancerService } from '@products/00_shared/services/load-balancer.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { StateService } from '@shared/services/state.service';

export class LoadBalancerActions {
  static async openArgoCD(lbSvc: LoadBalancerService, stateSvc: StateService, az: string, eid: string) {
    const res = await firstValueFrom(
      lbSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)
    );

    if (res) {
      window.open(res.link, '_blank');
    }
  }

  static deleteLoadBalancer(
    lbSvc: LoadBalancerService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    eid: string,
    name?: string
  ): Promise<boolean> {
    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete Load Balancer`,
        html: `
        <p>Are you sure you want to permanently delete "${name || eid}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting a load balancer is permanent and cannot be undone.</span>
        `,
      },
    });

    return new Promise(resolve => {
      ref.afterClosed().subscribe(res => {
        if (res === true) {
          firstValueFrom(
            lbSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, eid)
          ).then(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    });
  }
}
