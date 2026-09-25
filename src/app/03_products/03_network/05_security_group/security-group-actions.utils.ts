import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProductSecurityGroup } from '@products/00_shared/models/product.model';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { RESOURCE_EFFECTIVE_ID_LABEL_KEY } from '@shared/models/consts';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

export function redirectToParentKaas(
  router: Router,
  az: string | undefined,
  sg: ProductSecurityGroup
): void {
  if (!az) {
    return;
  }

  const labels = sg.securityGroup?.metadata.labels;
  const effectiveId = labels?.[RESOURCE_EFFECTIVE_ID_LABEL_KEY] ?? labels?.['superphenix.net/resourceEffectiveId'];
  if (!effectiveId) {
    return;
  }

  const url = router.serializeUrl(router.createUrlTree(['/products', 'paas', 'kaas', 'details', az, effectiveId]));
  window.open(url, '_blank');
}

export class SecurityGroupActions {
  static redirectToParentKaas = redirectToParentKaas;

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
