import { Clipboard } from '@angular/cdk/clipboard';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabsBase } from '@products/00_shared/components/tabs-base/tab-base.component';
import { ProductInstance, ProductSSH, ProductSubnet } from '@products/00_shared/models/product.model';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { SshService } from '@products/00_shared/services/ssh.service';
import { SubnetService } from '@products/00_shared/services/subnet.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { ButtonWithDropdownComponent } from '@shared/components/button-with-dropdown/button-with-dropdown.component';
import { ContentHeaderComponent } from '@shared/components/content-header/content-header.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { nonBlockingErrorHandler } from '@shared/http/customHandler';
import { PRA_LABEL_KEYS } from '@shared/models/consts';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { forkJoin, Observable, of } from 'rxjs';
import { InstanceDetailsAdvancedComponent } from './instance-details-advanced/instance-details-advanced.component';
import { InstanceDetailsGeneralComponent } from './instance-details-general/instance-details-general.component';
import { InstanceDetailsStorageComponent } from './instance-details-storage/instance-details-storage.component';
import { InstanceActions } from '../instance-actions.utils';
import { environment } from '@env/environment';

@Component({
  selector: 'spx-instance-details',
  imports: [
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatTableModule,
    ContentHeaderComponent,
    InstanceDetailsAdvancedComponent,
    InstanceDetailsGeneralComponent,
    InstanceDetailsStorageComponent,
    RouterLink,
    BannerComponent,
    GridDirective,
    SpanCopyComponent,
    ButtonWithDropdownComponent,
  ],
  templateUrl: './instance-details.component.html',
  styleUrl: './instance-details.component.scss',
})
export class InstanceDetailsComponent extends TabsBase {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected instanceSvc = inject(InstanceService);
  protected subnetSvc = inject(SubnetService);
  protected instanceSnapshotSvc = inject(InstanceSnapshotService);
  protected dialog = inject(MatDialog);
  protected sshSvc = inject(SshService);
  protected clipboard = inject(Clipboard);
  private readonly snackbar = inject(MatSnackBar);
  protected readonly supportEmail = environment.supportEmail;

  BannerLevelEnum = BannerLevelEnum;

  az = computed(() => {
    return this.routeParams()?.['az'];
  });

  canProjectInstanceControl = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceControl)
  );
  canProjectInstanceTerminal = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceTerminal)
  );
  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );
  canProjectSnapshotWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectSnapshotWrite)
  );

  canProjectArgoCdRead = computed(() => this.permissionSvc.permissions().includes(PermissionsEnum.ProjectArgoCdRead));

  routeParams;
  instanceProduct;
  subnetsProduct;
  sshKeysProduct;

  instanceTypeName = computed(() => {
    if (this.instanceProduct.hasValue()) {
      // spec.preference.name is the kubevirt spec shape, read it as-is.
      return this.instanceProduct.value()?.vm?.spec?.preference?.name;
    }
    return undefined;
  });

  isPRA = computed(() => {
    if (this.instanceProduct.hasValue()) {
      if (this.instanceProduct.value().vm?.metadata.labels) {
        return Object.keys(this.instanceProduct.value().vm!.metadata.labels!).some(v => PRA_LABEL_KEYS.includes(v));
      }
    }

    return false;
  });

  isClusterInstance = computed(() => {
    if (this.instanceProduct.hasValue()) {
      return isClusterResource(this.instanceProduct.value()?.vm?.metadata.labels);
    } else {
      return false;
    }
  });

  networkSubnetsMap = computed(() => {
    const networks = this.instanceProduct.hasValue()
      ? this.instanceProduct.value()?.vm?.spec.template?.spec.networks || []
      : [];
    const subnets = this.subnetsProduct.hasValue() ? this.subnetsProduct.value() : [];

    const result = new Map<string, ProductSubnet | undefined>();
    networks.forEach(network => {
      const networkName = network.multus?.networkName;
      const interfaceName = network.name;
      const subnet = subnets.find(s => s.eid === networkName?.split('/')?.[1]);

      result.set(interfaceName, subnet);
    });
    return result;
  });

  private needReload = signal(0);

  constructor() {
    super();
    const stateSvc = this.stateSvc;
    const instanceSvc = this.instanceSvc;
    const subnetSvc = this.subnetSvc;
    const route = inject(ActivatedRoute);

    this.routeParams = toSignal(route.params);
    this.instanceProduct = rxResource({
      params: computed(() => [stateSvc.project(), stateSvc.organization(), this.routeParams(), this.needReload()]),
      stream: () => {
        const az = this.routeParams()?.['az'];
        const id = this.routeParams()?.['id'];

        if (stateSvc.organization() && stateSvc.project() && id) {
          return instanceSvc.get(stateSvc.organization()!.id, stateSvc.project()!.id, az, id);
        } else {
          return of();
        }
      },
    });

    this.subnetsProduct = rxResource({
      params: () =>
        this.instanceProduct.hasValue() ? this.instanceProduct.value()?.vm?.spec.template?.spec.networks : undefined,
      stream: ({ params }) => {
        const networkNames = new Set(params?.filter(n => n.multus?.networkName).map(n => n.multus!.networkName) || []);
        const obs: Observable<ProductSubnet>[] = [];

        if (networkNames.size > 0) {
          networkNames.forEach(nn => {
            if (nn.split('/').length === 2) {
              obs.push(
                subnetSvc.get(
                  this.stateSvc.organization()!.id,
                  this.stateSvc.project()!.id,
                  this.az(),
                  nn.split('/')[1]
                )
              );
            }
          });
          return forkJoin(obs);
        } else {
          return of([]);
        }
      },
    });

    this.sshKeysProduct = rxResource({
      params: () =>
        this.instanceProduct.hasValue()
          ? this.instanceProduct.value()?.vm?.spec?.template?.spec?.accessCredentials
          : undefined,
      stream: ({ params }) => {
        const sshKeys = new Set(params?.map(n => n.sshPublicKey.source.secret.secretName) || []);
        const obs: Observable<ProductSSH>[] = [];

        if (sshKeys.size > 0) {
          sshKeys.forEach(keyEid => {
            obs.push(
              this.sshSvc
                .get(this.stateSvc.organization()!.id, this.stateSvc.project()!.id, this.az(), keyEid)
                .pipe(nonBlockingErrorHandler())
            );
          });
          return forkJoin<ProductSSH[]>(obs);
        } else {
          return of([]);
        }
      },
    });
  }

  start(product: ProductInstance) {
    InstanceActions.startInstance(this.instanceSvc, this.stateSvc, this.az(), product).then(() => this.reload());
  }

  stop(product: ProductInstance) {
    InstanceActions.stopInstance(this.instanceSvc, this.stateSvc, this.az(), product).then(() => this.reload());
  }

  stopForce(product: ProductInstance) {
    InstanceActions.stopForceInstance(this.instanceSvc, this.stateSvc, this.az(), product).then(() => this.reload());
  }

  restart(product: ProductInstance) {
    InstanceActions.restartInstance(this.instanceSvc, this.stateSvc, this.az(), product).then(() => this.reload());
  }

  reload() {
    this.needReload.update(v => v + 1);
  }

  openSerial(product: ProductInstance) {
    InstanceActions.openSerial(this.stateSvc, this.az(), product);
  }

  createSnapshot() {
    if (this.instanceProduct.hasValue()) {
      InstanceActions.createSnapshot(
        this.instanceSnapshotSvc,
        this.stateSvc,
        this.dialog,
        this.snackbar,
        this.az(),
        this.instanceProduct.value()
      );
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
    const url = `https://${window.location.host}/redirect/${this.stateSvc.organization()?.id}/${this.stateSvc.project()?.id}/${this.az()}/instance/${this.routeParams()?.['id']}`;
    this.copy(url);
  }

  async openArgoCD() {
    if (
      this.instanceProduct.hasValue() &&
      this.instanceProduct.value().gitops === 'true' &&
      !this.isClusterInstance()
    ) {
      InstanceActions.openArgoCD(this.instanceSvc, this.stateSvc, this.az(), this.instanceProduct.value());
    }
  }

  openVNC(product: ProductInstance) {
    InstanceActions.openVNC(this.stateSvc, this.az(), product);
  }

  deleteInstance(instance: ProductInstance) {
    InstanceActions.deleteInstance(this.instanceSvc, this.stateSvc, this.dialog, this.az(), instance).then(res => {
      if (res) {
        this.router.navigate(['/products', 'compute', 'instance']);
      }
    });
  }
}
