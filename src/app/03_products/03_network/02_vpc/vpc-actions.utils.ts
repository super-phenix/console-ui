import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProductVPC } from '@products/00_shared/models/product.model';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

export class VpcActions {
  static async openArgoCD(vpcSvc: VPCService, stateSvc: StateService, az: string, vpc: ProductVPC) {
    if (vpc.gitops === 'true') {
      const res = await firstValueFrom(
        vpcSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, vpc.eid)
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteVPC(
    vpcSvc: VPCService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    vpc: ProductVPC
  ): Promise<boolean> {
    if (az && vpc.eid) {
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete VPC`,
          html: `
          <p>Are you sure you want to permanently delete "${vpc.productName || vpc.eid}"?</p>
          <span class="color-warn"><strong>Warning:</strong> Deleting a VPC is permanent and cannot be undone.</span>
          `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(vpcSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, vpc.eid!)).then(() =>
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

  static addSubnet(router: Router, az: string, vpc: ProductVPC) {
    if (vpc.eid) {
      router.navigate(['/products', 'network', 'subnet', 'create'], {
        queryParams: { az: az, vpcEid: vpc.eid },
      });
    }
  }
}
