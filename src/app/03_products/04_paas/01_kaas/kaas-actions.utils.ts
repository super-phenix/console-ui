import { SecurityContext } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ProductKaaS } from '@products/00_shared/models/product.model';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateService } from '@shared/services/state.service';
import { firstValueFrom } from 'rxjs';

export class KaasActions {
  static async openArgoCD(kaasSvc: KaasService, stateSvc: StateService, cluster: ProductKaaS): Promise<void> {
    if (cluster.codeAZ && cluster.eid) {
      const res = await firstValueFrom(
        kaasSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, cluster.codeAZ, cluster.eid)
      );
      if (res.link) {
        window.open(res.link, '_blank');
      }
    }
  }

  static deleteKaaS(
    kaasSvc: KaasService,
    stateSvc: StateService,
    dialog: MatDialog,
    cluster: ProductKaaS
  ): Promise<boolean> {
    if (!cluster.codeAZ || !cluster.eid) return Promise.resolve(false);

    const name = cluster.productName || cluster.eid;
    const ref = dialog.open(ConfirmDialog, {
      data: {
        title: `Delete Cluster`,
        html: `
          <p>Are you sure you want to permanently delete "${name}"?</p>
          <span class="color-warn"><strong>Warning:</strong> Deleting a cluster is permanent and cannot be undone.</span>
        `,
      },
    });

    return new Promise(resolve => {
      ref.afterClosed().subscribe(res => {
        if (res === true) {
          firstValueFrom(
            kaasSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, cluster.codeAZ!, cluster.eid!)
          ).then(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    });
  }

  static downloadKubeConfig(
    kaasSvc: KaasService,
    stateSvc: StateService,
    sanitizer: DomSanitizer,
    cluster: ProductKaaS
  ): void {
    if (cluster.codeAZ && cluster.eid) {
      const name = cluster.productName || cluster.eid;
      kaasSvc
        .getKubeconfig(stateSvc.organization()!.id, stateSvc.project()!.id, cluster.codeAZ, cluster.eid)
        .subscribe(resp => {
          const blob = new Blob([resp]);
          const fileUrl = sanitizer.sanitize(
            SecurityContext.RESOURCE_URL,
            sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob))
          );
          if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `kubeconfig-${name}.yaml`;
            link.click();
          }
        });
    }
  }

  static async reinstallEssentials(
    kaasSvc: KaasService,
    stateSvc: StateService,
    az: string,
    cluster: ProductKaaS
  ): Promise<void> {
    if (az && cluster.eid) {
      await firstValueFrom(
        kaasSvc.reinstallEssentials(stateSvc.organization()!.id, stateSvc.project()!.id, az, cluster.eid)
      );
    }
  }
}
