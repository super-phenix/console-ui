import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { KaasService } from '@products/00_shared/services/kaas.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { KaasDetailsInstancesComponent } from '../kaas-details-instances/kaas-details-instances.component';
import { KaasDetailsNetpolsComponent } from '../kaas-details-netpols/kaas-details-netpols.component';
import { KaasActions } from '../kaas-actions.utils';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-kaas-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ContentHeaderComponent,
    MatTabsModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    KaasDetailsInstancesComponent,
    KaasDetailsNetpolsComponent,
    GridDirective,
    KeyValuePipe,
  ],
  templateUrl: './kaas-details.component.html',
  styleUrl: './kaas-details.component.scss',
})
export class KaasDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected kaasSvc = inject(KaasService);
  protected clipboard = inject(Clipboard);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  override readonly router = inject(Router);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;

  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  eid = computed(() => {
    return this.routeParams()?.['id'];
  });

  canProjectKaaSWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectKaaSWrite));
  canProjectKaaSKubeConfig = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectKaaSKubeConfig)
  );
  canProjectInstanceRead = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceRead)
  );
  canProjectSecurityGroupRead = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSecurityGroupRead)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  kaasProduct;

  isPRA = computed(() => {
    if (this.kaasProduct.hasValue()) {
      if (this.kaasProduct.value().cluster?.cluster.metadata.labels) {
        return Object.keys(this.kaasProduct.value().cluster!.cluster.metadata.labels!).some(v =>
          PRA_LABEL_KEYS.includes(v)
        );
      }
    }

    return false;
  });

  productLabelInfo = computed(() => {
    if (this.kaasProduct.hasValue()) {
      return getProductLabelInfo(this.kaasProduct.value().cluster?.cluster.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  sortedMachineDeployments = computed(() => {
    const kaas = this.kaasProduct.hasValue() ? this.kaasProduct.value() : undefined;
    if (kaas) {
      return kaas.cluster?.machineDeployments.sort((a, b) => {
        if (a.machineDeployment.metadata.labels && b.machineDeployment.metadata.labels) {
          return a.machineDeployment.metadata.labels['superphenix.net/resourceName'].localeCompare(
            b.machineDeployment.metadata.labels['superphenix.net/resourceName']
          );
        }
        return 0;
      });
    }
    return [];
  });

  constructor() {
    super();
    const stateSvc = this.stateSvc;
    const kaasSvc = this.kaasSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);

    this.kaasProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return kaasSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });
  }

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/kaas/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  deleteKaaS() {
    if (this.kaasProduct.hasValue()) {
      KaasActions.deleteKaaS(this.kaasSvc, this.stateSvc, this.dialog, this.kaasProduct.value()).then(res => {
        if (res) {
          this.router.navigate(['/products', 'paas', 'kaas']);
        }
      });
    }
  }

  downloadKubeconfig() {
    if (this.kaasProduct.hasValue()) {
      KaasActions.downloadKubeConfig(this.kaasSvc, this.stateSvc, this.sanitizer, this.kaasProduct.value());
    }
  }

  reinstallEssentials() {
    if (this.kaasProduct.hasValue()) {
      KaasActions.reinstallEssentials(this.kaasSvc, this.stateSvc, this.az(), this.kaasProduct.value());
    }
  }

  async openArgoCD() {
    if (this.kaasProduct.hasValue()) {
      await KaasActions.openArgoCD(this.kaasSvc, this.stateSvc, this.kaasProduct.value());
    }
  }
}
