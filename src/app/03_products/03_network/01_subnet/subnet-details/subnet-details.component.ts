import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';
import { EipService } from '@products/00_shared/services/eip.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { VPCService } from '@products/00_shared/services/vpc.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { EMPTY, of } from 'rxjs';
import { SubnetActions } from '../subnet-actions.utils';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-subnet-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ContentHeaderComponent,
    MatChipsModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    GridDirective,
    MatMenuModule,
    MatDividerModule,
    NgTemplateOutlet,
    KeyValuePipe,
  ],
  templateUrl: './subnet-details.component.html',
  styleUrl: './subnet-details.component.scss',
})
export class SubnetDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected subnetSvc = inject(SubnetService);
  protected vpcSvc = inject(VPCService);
  protected eipSvc = inject(EipService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  ProtocolEnum = ProtocolEnum;
  BannerLevelEnum = BannerLevelEnum;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectSubnetWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSubnetWrite));
  canProjectEipWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectEipWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  subnetProduct;
  vpcProduct;

  isSharedSubnet = computed(() => {
    if (this.subnetProduct.hasValue()) {
      return this.subnetProduct.value().subnet?.isShared;
    }

    return false;
  });

  isPRA = computed(() => {
    if (this.subnetProduct.hasValue()) {
      if (this.subnetProduct.value().subnet?.metadata.labels) {
        return Object.keys(this.subnetProduct.value().subnet!.metadata.labels!).some(v => PRA_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  productLabelInfo = computed(() => {
    if (this.subnetProduct.hasValue()) {
      return getProductLabelInfo(this.subnetProduct.value().subnet?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  subnetError = computed(() => {
    if (this.subnetProduct.hasValue()) {
      const subnet = this.subnetProduct.value();
      const error = subnet?.subnet?.status.conditions?.find(c => c.type === 'Error');
      if (error?.status === 'True') {
        return error;
      }
    }
    return;
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const subnetSvc = this.subnetSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.subnetProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return subnetSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    this.vpcProduct = rxResource({
      params: () => (this.subnetProduct.hasValue() ? this.subnetProduct.value().subnet?.spec.vpc : undefined),
      stream: ({ params }) => {
        const vpcEid = params;
        if (vpcEid && !this.isSharedSubnet()) {
          return this.vpcSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), vpcEid);
        } else {
          return EMPTY;
        }
      },
    });
  }

  attachEip() {
    const subnet = this.subnetProduct.value();
    if (subnet) {
      SubnetActions.attachEip(this.router, subnet);
    }
  }

  copy(value: string) {
    this.clipboard.copy(value);
    this.snackbar.open('Copy to clipboard!', undefined, {
      horizontalPosition: 'end',
      duration: 3000,
    });
  }

  copyShareLink() {
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/subnet/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  openArgoCD() {
    const subnet = this.subnetProduct.value();
    if (subnet) {
      SubnetActions.openArgoCD(this.subnetSvc, this.stateSvc, subnet);
    }
  }

  deleteSubnet() {
    const subnet = this.subnetProduct.value();
    if (subnet) {
      SubnetActions.deleteSubnet(this.subnetSvc, this.stateSvc, this.dialog, subnet).then(res => {
        if (res) {
          this.router.navigate(['/products', 'network', 'subnet']);
        }
      });
    }
  }
}
