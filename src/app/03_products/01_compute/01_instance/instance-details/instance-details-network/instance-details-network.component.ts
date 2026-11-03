import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnDestroy, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { InterfaceElement, VirtualMachineInstanceNetworkInterface } from '@products/00_shared/models/compute/instance/vmi.model';
import { ProductInstance, ProductSubnet } from '@products/00_shared/models/product.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { isClusterResource } from '@products/00_shared/utils/cluster-utils';
import { BannerComponent } from '@shared/components/banner/banner.component';
import { SpanCopyComponent } from '@shared/components/span-copy/span-copy.component';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { GridDirective } from '@shared/directives/grid.directive';
import { BannerLevelEnum } from '@shared/models/enums';
import { PermissionsEnum } from '@shared/models/permissions/permission.enum';
import { PermissionService } from '@shared/services/permission.service';
import { StateService } from '@shared/services/state.service';
import { Subscription, take, timer } from 'rxjs';
import { buildUpdatePayloadFromInstance, extractNetworksFromInstance } from '../../instance-actions.utils';

@Component({
  selector: 'spx-instance-details-network',
  imports: [
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterLink,
    SpanCopyComponent,
    BannerComponent,
    GridDirective,
  ],
  templateUrl: './instance-details-network.component.html',
  styleUrl: './instance-details-network.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceDetailsNetworkComponent implements OnDestroy {
  protected stateSvc = inject(StateService);
  protected permissionSvc = inject(PermissionService);
  protected instanceSvc = inject(InstanceService);
  protected dialog = inject(MatDialog);
  protected snackbar = inject(MatSnackBar);
  protected destroyRef = inject(DestroyRef);

  BannerLevelEnum = BannerLevelEnum;

  az = input.required<string>();
  instance = input.required<ProductInstance>();
  subnetsMap = input<Map<string, ProductSubnet | undefined>>(new Map());
  dataChanged = output<void>();

  syncingInterfaces = signal<Set<string>>(new Set());
  private pollSubscriptions = new Map<string, Subscription>();

  canProjectInstanceWrite = computed(() =>
    this.permissionSvc.permissions().includes(PermissionsEnum.ProjectInstanceWrite)
  );

  isClusterInstance = computed(() => isClusterResource(this.instance()?.vm?.metadata?.labels));

  ngOnDestroy(): void {
    this.pollSubscriptions.forEach(sub => sub.unsubscribe());
    this.pollSubscriptions.clear();
    this.syncingInterfaces.set(new Set());
  }

  getVmInterface(networkName: string, index?: number): InterfaceElement | undefined {
    const inst = this.instance();
    const interfaces =
      inst?.vm?.spec?.template?.spec?.domain?.devices?.interfaces ??
      inst?.vmi?.spec?.domain?.devices?.interfaces;
    if (!interfaces) return undefined;
    return interfaces.find(i => i.name === networkName) ?? (index !== undefined ? interfaces[index] : undefined);
  }

  getVmiInterface(networkName: string, index?: number): VirtualMachineInstanceNetworkInterface | undefined {
    const interfaces = this.instance()?.vmi?.status?.interfaces;
    if (!interfaces) return undefined;
    return interfaces.find(i => i.name === networkName) ?? (index !== undefined ? interfaces[index] : undefined);
  }

  isVmRunning(): boolean {
    const inst = this.instance();
    if (!inst?.vmi) return false;
    const phase = inst.vmi.status?.phase;
    return !phase || (phase !== 'Succeeded' && phase !== 'Failed');
  }

  isInterfaceDesiredUp(vmInterface?: InterfaceElement): boolean {
    if (!vmInterface) return true;
    return vmInterface.state !== 'down';
  }

  getOperationalCarrierState(vmiInterface?: VirtualMachineInstanceNetworkInterface): string {
    if (!this.isVmRunning()) {
      return 'Instance stopped';
    }
    if (vmiInterface?.linkState === 'down') {
      return 'Link Down';
    }
    if (vmiInterface?.linkState === 'up') {
      return 'Link Up';
    }
    return 'Unknown';
  }

  isPrimaryInterfaceDisabled(index: number, vmInterface?: InterfaceElement): boolean {
    return index === 0 && !this.isInterfaceDesiredUp(vmInterface);
  }

  isLinkStateSyncing(
    networkName: string,
    vmInterface?: InterfaceElement,
    vmiInterface?: VirtualMachineInstanceNetworkInterface
  ): boolean {
    if (this.syncingInterfaces().has(networkName)) {
      return true;
    }
    if (!this.isVmRunning()) {
      return false;
    }
    if (!vmiInterface || !vmiInterface.linkState) {
      return false;
    }
    const desired = this.isInterfaceDesiredUp(vmInterface) ? 'up' : 'down';
    return desired !== vmiInterface.linkState;
  }

  canToggleLinkState(): boolean {
    if (!this.canProjectInstanceWrite()) {
      return false;
    }
    const inst = this.instance();
    if (!inst) {
      return false;
    }
    if (inst.gitops === 'true') {
      return false;
    }
    if (this.isClusterInstance()) {
      return false;
    }
    return true;
  }

  isUpdatingLinkState(networkName: string): boolean {
    return this.syncingInterfaces().has(networkName);
  }

  toggleInterfaceLink(interfaceName: string, enable: boolean): void {
    const instance = this.instance();
    const projectId = this.stateSvc.project()?.id ?? '';
    const subnetEid = instance ? this.getSubnetEidForInterface(instance, interfaceName, projectId) : undefined;
    const targetNetwork = subnetEid
      ? extractNetworksFromInstance(instance, projectId).find(network => network.subnetEId === subnetEid)
      : undefined;

    const networks = instance?.vm?.spec?.template?.spec?.networks ?? instance?.vmi?.spec?.networks ?? [];
    const networkIndex = networks.findIndex(n => n.name === interfaceName);
    const isPrimary = targetNetwork ? targetNetwork.order === 0 : networkIndex === 0;

    if (isPrimary && !enable) {
      const ref = this.dialog.open(ConfirmDialog, {
        data: {
          title: 'Disable primary interface?',
          content:
            'Disabling the primary interface will disconnect default gateway connectivity. Remote access may be interrupted. Are you sure you want to proceed?',
          confirmBtn: 'Disable',
          cancelBtn: 'Cancel',
        },
      });

      ref.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.executeLinkStateUpdate(interfaceName, subnetEid, enable);
        }
      });
    } else {
      this.executeLinkStateUpdate(interfaceName, subnetEid, enable);
    }
  }

  private getSubnetEidForInterface(instance: ProductInstance, interfaceName: string, projectId: string): string | undefined {
    const networks = instance.vm?.spec?.template?.spec?.networks ?? instance.vmi?.spec?.networks ?? [];
    const multusName = networks.find(network => network.name === interfaceName)?.multus?.networkName;
    if (!multusName) {
      return undefined;
    }

    const projectPrefix = projectId ? `spx-${projectId}/` : '';
    if (projectPrefix && multusName.startsWith(projectPrefix)) {
      return multusName.slice(projectPrefix.length);
    }
    return multusName.includes('/') ? multusName.split('/')[1] : multusName;
  }

  private executeLinkStateUpdate(interfaceName: string, subnetEid: string | undefined, enable: boolean): void {
    const instance = this.instance();
    if (!instance || !subnetEid) {
      return;
    }

    const wasVmRunning = this.isVmRunning();
    const projectId = this.stateSvc.project()?.id ?? '';
    const orgId = this.stateSvc.organization()?.id ?? '';
    const az = this.az();
    const effectiveId = instance.eid;

    this.syncingInterfaces.update(set => new Set(set).add(interfaceName));

    const currentNetworks = extractNetworksFromInstance(instance, projectId);
    if (!currentNetworks.some(network => network.subnetEId === subnetEid)) {
      this.stopPolling(interfaceName);
      return;
    }

    const updatedNetworks = currentNetworks.map(net => {
      if (net.subnetEId === subnetEid) {
        return { ...net, enabled: enable };
      }
      return net;
    });

    const updatePayload = buildUpdatePayloadFromInstance(instance, updatedNetworks);
    if (!updatePayload) {
      this.stopPolling(interfaceName);
      this.snackbar.open('Memory size could not be read; set it from the update page first', undefined, {
        duration: 5000,
        horizontalPosition: 'end',
      });
      return;
    }

    this.instanceSvc.update(orgId, projectId, az, effectiveId, updatePayload).subscribe({
      next: () => {
        this.snackbar.open('Network interface link state updated', undefined, {
          duration: 3000,
          horizontalPosition: 'end',
        });
        if (wasVmRunning) {
          this.startPollingLinkState(interfaceName, enable);
        } else {
          this.stopPolling(interfaceName);
        }
        this.dataChanged.emit();
      },
      error: () => {
        this.stopPolling(interfaceName);
      },
    });
  }

  private startPollingLinkState(interfaceName: string, targetState: boolean): void {
    if (this.pollSubscriptions.has(interfaceName)) {
      this.pollSubscriptions.get(interfaceName)!.unsubscribe();
      this.pollSubscriptions.delete(interfaceName);
    }

    let attempts = 0;
    const maxAttempts = 5;
    const targetLinkState = targetState ? 'up' : 'down';

    const pollSub = timer(1500, 1500)
      .pipe(take(maxAttempts), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          attempts++;
          const currentInstance = this.instance();
          const vmiIface = currentInstance?.vmi?.status?.interfaces?.find(i => i.name === interfaceName);
          if (vmiIface?.linkState === targetLinkState || attempts >= maxAttempts) {
            this.stopPolling(interfaceName);
          } else {
            this.dataChanged.emit();
          }
        },
        complete: () => {
          this.stopPolling(interfaceName);
        },
      });

    this.pollSubscriptions.set(interfaceName, pollSub);
  }

  private stopPolling(interfaceName: string): void {
    if (this.pollSubscriptions.has(interfaceName)) {
      this.pollSubscriptions.get(interfaceName)!.unsubscribe();
      this.pollSubscriptions.delete(interfaceName);
    }
    this.syncingInterfaces.update(set => {
      const next = new Set(set);
      next.delete(interfaceName);
      return next;
    });
  }
}
