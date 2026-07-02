import { Clipboard } from '@angular/cdk/clipboard';
import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProtocolEnum } from '@products/00_shared/models/network/subnet/protocol.enum';
import { LoadBalancerService } from '@products/00_shared/services/load-balancer.service';
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
import { LoadBalancerActions } from '../load-balancer-actions.utils';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-load-balancer-details',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ContentHeaderComponent,
    KeyValuePipe,
    MatChipsModule,
    RouterLink,
    BannerComponent,
    SpanCopyComponent,
    GridDirective,
    MatDividerModule,
  ],
  templateUrl: './load-balancer-details.component.html',
  styleUrl: './load-balancer-details.component.scss',
})
export class LoadBalancerDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected lbSvc = inject(LoadBalancerService);
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

  canProjectLoadBalancerWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectLoadBalancerWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  lbProduct;

  lbTarget = computed(() => {
    if (this.lbProduct.hasValue()) {
      const lb = this.lbProduct.value();
      if (lb.loadBalancer?.spec?.selector && lb.loadBalancer?.spec?.selector?.length > 0) {
        return lb.loadBalancer?.spec?.selector;
      } else if (lb.loadBalancer?.spec?.endpoints && lb.loadBalancer?.spec?.endpoints?.length > 0) {
        return lb.loadBalancer?.spec?.endpoints;
      }
    }
    return [];
  });

  isPRA = computed(() => {
    if (this.lbProduct.hasValue()) {
      if (this.lbProduct.value().loadBalancer?.metadata.labels) {
        return Object.keys(this.lbProduct.value().loadBalancer!.metadata.labels!).some(v => PRA_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  productLabelInfo = computed(() => {
    if (this.lbProduct.hasValue()) {
      return getProductLabelInfo(this.lbProduct.value().loadBalancer?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const lbSvc = this.lbSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.lbProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return lbSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/loadBalancer/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async openArgoCD() {
    if (this.lbProduct.hasValue() && this.lbProduct.value().gitops === 'true') {
      await LoadBalancerActions.openArgoCD(this.lbSvc, this.stateSvc, this.az(), this.lbProduct.value().eid);
    }
  }

  async deleteLoadBalancer() {
    if (this.az() && this.lbProduct.hasValue()) {
      const res = await LoadBalancerActions.deleteLoadBalancer(
        this.lbSvc,
        this.stateSvc,
        this.dialog,
        this.az(),
        this.lbProduct.value().eid,
        this.lbProduct.value().productName
      );
      if (res) {
        this.router.navigate(['/products', 'network', 'load-balancer']);
      }
    }
  }
}
