import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductBaaS } from '@products/00_shared/models/product.model';
import { UpdateBaaS, UpdateBaaSProduct } from '@products/00_shared/models/storage/baas/baas';
import { BaasService } from '@products/00_shared/services/baas.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

export class BaasActions {
  static async changeScheduleState(
    baasSvc: BaasService,
    stateSvc: StateService,
    snackbar: MatSnackBar,
    baas: ProductBaaS,
    onSuccess: () => void
  ) {
    if (baas.eid && baas.productName && baas.codeAZ) {
      const orgId = stateSvc.organization()!.id;
      const projId = stateSvc.project()!.id;

      const forUpdate: UpdateBaaSProduct | undefined = await firstValueFrom(
        baasSvc.getForUpdate(orgId, projId, baas.codeAZ, baas.eid)
      )
        .then(v => v)
        .catch(() => undefined);

      if (forUpdate && forUpdate.spec) {
        const body: UpdateBaaS = {
          general: {
            productName: baas.productName,
          },
          spec: {
            labelSelector: forUpdate.spec?.labelSelector,
            paused: !forUpdate.spec.paused,
            retention: forUpdate.spec.retention,
            schedule: forUpdate.spec.schedule,
          },
        };

        await firstValueFrom(baasSvc.update(orgId, projId, baas.codeAZ, baas.eid, body));

        snackbar.open('Schedule updated!\n Change should apply soon.\n Reloading data in 5 seconds.', undefined, {
          horizontalPosition: 'end',
          duration: 5000,
          panelClass: ['snackbar', 'snackbar--multiline'],
        });

        setTimeout(onSuccess, 5000);
      }
    }
  }

  static async openArgoCD(baasSvc: BaasService, stateSvc: StateService, baas: ProductBaaS) {
    if (baas.eid && baas.codeAZ) {
      const res = await firstValueFrom(
        baasSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, baas.codeAZ, baas.eid)
      );

      if (res) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteBaaS(
    baasSvc: BaasService,
    stateSvc: StateService,
    dialog: MatDialog,
    baas: ProductBaaS
  ): Promise<boolean> {
    if (!baas.codeAZ || !baas.eid) return Promise.resolve(false);

    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete BaaS`,
        html: `
          <p>Are you sure you want to permanently delete "${baas.productName || baas.eid}"?</p>
          <span class="color-warn"><strong>Warning:</strong> Deleting a BaaS is permanent and cannot be undone.</span>
        `,
      },
    });

    return new Promise(resolve => {
      ref.afterClosed().subscribe(res => {
        if (res === true) {
          firstValueFrom(
            baasSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, baas.codeAZ!, baas.eid!)
          ).then(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    });
  }
}
