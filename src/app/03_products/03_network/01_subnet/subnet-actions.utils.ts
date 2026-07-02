import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { ProductSubnet } from '@products/00_shared/models/product.model';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { StateService } from '@shared/services/state.service';
import { Router } from '@angular/router';

export class SubnetActions {
  static attachEip(router: Router, subnet: ProductSubnet) {
    if (subnet.eid && subnet.codeAZ) {
      router.navigate(['/products', 'network', 'eip', 'create'], {
        queryParams: { az: subnet.codeAZ, subnetEid: subnet.eid },
      });
    }
  }

  static async openArgoCD(subnetSvc: SubnetService, stateSvc: StateService, subnet: ProductSubnet) {
    if (subnet.gitops === 'true' && subnet.eid && subnet.codeAZ) {
      const res = await firstValueFrom(
        subnetSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, subnet.codeAZ, subnet.eid)
      );
      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static async deleteSubnet(
    subnetSvc: SubnetService,
    stateSvc: StateService,
    dialog: MatDialog,
    subnet: ProductSubnet
  ): Promise<boolean> {
    if (!subnet.codeAZ || !subnet.eid) return false;

    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete Subnet`,
        html: `
          <p>Are you sure you want to permanently delete "${subnet.productName || subnet.eid}"?</p>
          <span class="color-warn"><strong>Warning:</strong> Deleting a subnet is permanent and cannot be undone.</span>
        `,
      },
    });

    const res = await firstValueFrom(ref.afterClosed());
    if (res === true) {
      await firstValueFrom(
        subnetSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, subnet.codeAZ, subnet.eid)
      );
      return true;
    }
    return false;
  }
}
