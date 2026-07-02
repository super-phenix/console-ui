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
import { FirewallService } from '@products/00_shared/services/firewall.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
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
import { RuleDisplayComponent } from './rule-display/rule-display.component';
import { FirewallActions } from '../firewall-actions.utils';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-firewall-details',
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
  templateUrl: './firewall-details.component.html',
  styleUrl: './firewall-details.component.scss',
})
export class FirewallDetailsComponent {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected fwSvc = inject(FirewallService);
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

  canProjectFirewallWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectFirewallWrite)
  );
  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  fwProduct;

  isPRA = computed(() => {
    if (this.fwProduct.hasValue()) {
      if (this.fwProduct.value().firewall?.metadata.labels) {
        return Object.keys(this.fwProduct.value().firewall!.metadata.labels!).some(v => PRA_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  isClusterFirewall = computed(() => isClusterResource(this.fwProduct.value()?.firewall?.metadata.labels));

  productLabelInfo = computed(() => {
    if (this.fwProduct.hasValue()) {
      return getProductLabelInfo(this.fwProduct.value().firewall?.metadata?.labels);
    }
    return getProductLabelInfo();
  });

  constructor() {
    const stateSvc = this.stateSvc;
    const fwSvc = this.fwSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.fwProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return fwSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/firewall/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async openArgoCD() {
    if (this.fwProduct.hasValue() && this.fwProduct.value().gitops === 'true' && !this.isClusterFirewall()) {
      FirewallActions.openArgoCD(this.fwSvc, this.stateSvc, this.az(), this.fwProduct.value().eid);
    }
  }

  deleteFirewall() {
    if (this.az() && this.fwProduct.hasValue()) {
      FirewallActions.deleteFirewall(
        this.fwSvc,
        this.stateSvc,
        this.dialog,
        this.az(),
        this.fwProduct.value()!.eid!,
        this.fwProduct.value().productName
      ).then(res => {
        if (res) {
          this.router.navigate(['/products', 'network', 'firewall']);
        }
      });
    }
  }
}
