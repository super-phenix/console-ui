import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe, NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';
import { SecurityGroupService } from '@products/00_shared/services/security-group.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { ProductSecurityGroup, ProductSubnet } from '@products/00_shared/models/product.model';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { DR_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { of } from 'rxjs';
import { RuleDisplayComponent } from './rule-display/rule-display.component';
import { SecurityGroupActions } from '../security-group-actions.utils';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-security-group-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ContentHeaderComponent,
    KeyValuePipe,
    MatChipsModule,
    RouterLink,
    BannerComponent,
    RuleDisplayComponent,
    SpanCopyComponent,
    GridDirective,
    NgClass,
  ],
  templateUrl: './security-group-details.component.html',
  styleUrl: './security-group-details.component.scss',
})
export class SecurityGroupDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected sgSvc = inject(SecurityGroupService);
  protected subnetSvc = inject(SubnetService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  ProtocolEnum = ProtocolEnum;
  BannerLevelEnum = BannerLevelEnum;
  Object = Object;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectSecurityGroupWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSecurityGroupWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));
  canProjectKaaSRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectKaaSRead));

  routeParams;
  sgProduct;

  isDR = computed(() => {
    if (this.sgProduct.hasValue()) {
      if (this.sgProduct.value().securityGroup?.metadata.labels) {
        return Object.keys(this.sgProduct.value().securityGroup!.metadata.labels!).some(v => DR_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  isClusterSecurityGroup = computed(() => isClusterResource(this.sgProduct.value()?.securityGroup?.metadata.labels));

  productLabelInfo = computed(() => {
    if (this.sgProduct.hasValue()) {
      return getProductLabelInfo(this.sgProduct.value().securityGroup?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const sgSvc = this.sgSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.subnets = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.az(), this.sgProduct.value()]),
      stream: () => {
        const az = this.az();
        const subnetEIds = this.sgProduct.value()?.securityGroup?.subnetEIds;
        if (stateSvc.organization() && stateSvc.project() && az && subnetEIds && subnetEIds.length > 0) {
          return this.subnetSvc.listByAZ(stateSvc.organization()!.id, stateSvc.project()!.id, az);
        }
        return of([] as ProductSubnet[]);
      },
    });

    this.sgProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return sgSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });
  }

  subnets;

  subnetDetails = computed(() => {
    const subnetEIds = this.sgProduct.value()?.securityGroup?.subnetEIds;
    const allSubnets = this.subnets.value();
    if (!subnetEIds || !allSubnets) return [];
    return subnetEIds.map(eid => allSubnets.find(s => s.eid === eid)).filter((s): s is ProductSubnet => !!s);
  });

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/securityGroup/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async openArgoCD() {
    if (this.sgProduct.hasValue() && this.sgProduct.value().gitops === 'true' && !this.isClusterSecurityGroup()) {
      SecurityGroupActions.openArgoCD(this.sgSvc, this.stateSvc, this.az(), this.sgProduct.value().eid);
    }
  }

  redirectToCluster(sgProduct: ProductSecurityGroup) {
    SecurityGroupActions.redirectToParentKaas(this.router, this.az(), sgProduct);
  }

  deleteSecurityGroup() {
    if (this.az() && this.sgProduct.hasValue()) {
      SecurityGroupActions.deleteSecurityGroup(
        this.sgSvc,
        this.stateSvc,
        this.dialog,
        this.az(),
        this.sgProduct.value()!.eid!,
        this.sgProduct.value().productName
      ).then(res => {
        if (res) {
          this.router.navigate(['/products', 'network', 'security-group']);
        }
      });
    }
  }
}
