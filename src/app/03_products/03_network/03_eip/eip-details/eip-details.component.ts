import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EipService } from '@products/00_shared/services/eip.service';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { EipActions } from '../eip-actions.utils';
import { EMPTY, of } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-eip-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ContentHeaderComponent,
    MatTableModule,
    KeyValuePipe,
    MatChipsModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    GridDirective,
  ],
  templateUrl: './eip-details.component.html',
  styleUrl: './eip-details.component.scss',
})
export class EipDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected eipSvc = inject(EipService);
  protected subnetSvc = inject(SubnetService);
  protected clipboard = inject(Clipboard);
  protected router = inject(Router);

  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;
  BannerLevelEnum = BannerLevelEnum;
  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectEipWrite = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectEipWrite));
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  displayedColumnsSNAT: string[] = ['cidr', 'ip', 'ready'];
  displayedColumnsDNAT: string[] = ['external', 'internal', 'protocol', 'ready'];

  routeParams;
  eipProduct;
  subnetProduct;

  isPRA = computed(() => {
    if (this.eipProduct.hasValue()) {
      if (this.eipProduct.value().eip?.metadata.labels) {
        return Object.keys(this.eipProduct.value().eip!.metadata.labels!).some(v => PRA_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  productLabelInfo = computed(() => {
    if (this.eipProduct.hasValue()) {
      return getProductLabelInfo(this.eipProduct.value().eip?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  isSnatLegacy = computed(() => {
    if (this.eipProduct.hasValue()) {
      return this.eipProduct.value()?.snat?.some(s => s.legacy);
    }
    return false;
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const eipSvc = this.eipSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.eipProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return eipSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    this.subnetProduct = rxResource({
      params: () => (this.eipProduct.hasValue() ? this.eipProduct.value()?.eip?.spec.natGwDp : undefined),
      stream: ({ params }) => {
        const vpcEid = params;
        if (vpcEid) {
          return this.subnetSvc.get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), vpcEid);
        } else {
          return EMPTY;
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/eip/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async openArgoCD() {
    if (this.eipProduct.hasValue() && this.eipProduct.value().gitops === 'true') {
      EipActions.openArgoCD(this.eipSvc, this.stateSvc, this.az(), this.eipProduct.value().eid);
    }
  }

  deleteEIP() {
    if (this.az() && this.eipProduct.hasValue()) {
      EipActions.deleteEIP(
        this.eipSvc,
        this.stateSvc,
        this.dialog,
        this.az(),
        this.eipProduct.value().eid,
        this.eipProduct.value().productName || ''
      ).then(res => {
        if (res) {
          this.router.navigate(['/products', 'network', 'eip']);
        }
      });
    }
  }
}
