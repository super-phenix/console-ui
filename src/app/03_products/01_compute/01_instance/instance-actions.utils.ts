import { firstValueFrom } from 'rxjs';
import { ProductInstance } from '@products/00_shared/models/product.model';
import { InstanceService } from '@products/00_shared/services/instance.service';
import { StateService } from '@shared/services/state.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { InstanceSnapshotService } from '@products/00_shared/services/instance-snapshot.service';
import { CreateInstanceSnapshot } from '@products/00_shared/models/compute/instance-snapshot/create-instance-snapshot.model';
import {
  InstanceSnapshotCreateDialogComponent,
  InstanceSnapshotCreateResultDialog,
} from '@products/01_compute/02_instance_snapshot/instance-snapshot-create-dialog/instance-snapshot-create-dialog.component';
import {
  BUS_AUTO,
  CPU_DEFAULT_VALUE,
  CpuValue,
  CreateInstanceDisk,
  CreateInstanceNetwork,
  DEFAULT_CLOUD_INIT,
  MEMORY_DEFAULT_VALUE,
  MemoryValue,
  NETWORK_MODEL_AUTO,
  UpdateInstance,
  VM_TYPE_DEFAULT,
} from '@products/00_shared/models/compute/instance/instance';
import { RunStrategy } from '@products/00_shared/models/compute/instance/enums/run-strategy.enum';
import { extractVolumeEID } from '@products/00_shared/models/compute/instance/utils';
import { AdvancedOptionsInput } from '@products/00_shared/models/compute/instance/advanced-options.model';
import { CUSTOM_USER_LABEL_PREFIX, RESOURCE_LOCAL_ID_LABEL_KEY } from '@shared/models/consts';
import { Router } from '@angular/router';
import { getProductLabelInfo } from '@products/00_shared/utils/product-label-utils';
import { v5 as uuidv5 } from 'uuid';

export function parseIp(ip: string): { v4?: string; v6?: string } {
  if (!ip) {
    return {};
  }
  const ips = ip.split(',');
  if (ips.length === 2) {
    return { v4: ips[0].trim(), v6: ips[1].trim() };
  } else {
    if (ip.includes(':')) {
      return { v6: ip.trim() };
    } else {
      return { v4: ip.trim() };
    }
  }
}

export function extractNetworksFromInstance(instance: ProductInstance, projectId: string): CreateInstanceNetwork[] {
  if (!instance) {
    return [];
  }

  const networkList: CreateInstanceNetwork[] = [];
  const networks = instance.vm?.spec?.template?.spec?.networks ?? instance.vmi?.spec?.networks ?? [];
  const domainInterfaces =
    instance.vm?.spec?.template?.spec?.domain?.devices?.interfaces ??
    instance.vmi?.spec?.domain?.devices?.interfaces ??
    [];
  const statusInterfaces = instance.vmi?.status?.interfaces ?? [];
  const annotations =
    instance.vm?.spec?.template?.metadata?.annotations ??
    instance.vm?.metadata?.annotations ??
    instance.vmi?.metadata?.annotations ??
    {};

  const projectPrefix = projectId ? `spx-${projectId}/` : '';

  networks.forEach((v, i) => {
    const multusName = v.multus?.networkName;
    let subnetEid = '';
    if (multusName) {
      if (projectPrefix && multusName.startsWith(projectPrefix)) {
        subnetEid = multusName.slice(projectPrefix.length);
      } else if (multusName.includes('/')) {
        subnetEid = multusName.split('/')[1];
      } else {
        subnetEid = multusName;
      }
    }

    if (!subnetEid) {
      return;
    }

    // Match interface by name first, fall back to array index
    const iface = domainInterfaces.find(item => item.name === v.name) ?? domainInterfaces[i];
    const statusIface = statusInterfaces.find(item => item.name === v.name) ?? statusInterfaces[i];

    const network: CreateInstanceNetwork = {
      order: i,
      subnetEId: subnetEid,
      model: iface?.model || NETWORK_MODEL_AUTO,
      enabled: iface?.state !== 'down',
    };

    const macAnnotationKey = `${subnetEid}.spx-${projectId}.ovn.kubernetes.io/mac_address`;
    const macAddress =
      iface?.macAddress ||
      annotations[macAnnotationKey] ||
      (projectId ? annotations[`${subnetEid}.${projectId}.ovn.kubernetes.io/mac_address`] : undefined) ||
      statusIface?.mac;
    if (macAddress) {
      network.macAddress = macAddress;
    }

    const annotationKey = `${subnetEid}.spx-${projectId}.ovn.kubernetes.io/ip_address`;
    const ipAddress = annotations[annotationKey];
    if (ipAddress) {
      const parsed = parseIp(ipAddress);
      if (parsed.v4) {
        network.ipv4 = parsed.v4;
      }
      if (parsed.v6) {
        network.ipv6 = parsed.v6;
      }
    }

    networkList.push(network);
  });

  return networkList;
}

export function buildUpdatePayloadFromInstance(
  instance: ProductInstance,
  updatedNetworks: CreateInstanceNetwork[],
  advanced?: AdvancedOptionsInput
): UpdateInstance {
  const volumes = instance.vm?.spec?.template?.spec?.volumes;
  const diskList = instance.vm?.spec?.template?.spec?.domain?.devices?.disks;

  let cloudInitConfig: string | undefined = undefined;
  if (instance.cloudInit) {
    cloudInitConfig = instance.cloudInit;
  } else {
    const cloudInitVolume = volumes?.find(v => v.name === 'cloud-init');
    if (cloudInitVolume) {
      cloudInitConfig = cloudInitVolume.cloudInitNoCloud?.userData;
    }
  }

  let cloudInitBus: string = BUS_AUTO.value;
  if (diskList) {
    const cloudInitDisk = diskList.find(d => d.name === 'cloud-init');
    if (cloudInitDisk?.disk?.bus) {
      cloudInitBus = cloudInitDisk.disk.bus;
    }
  }

  let disks: CreateInstanceDisk[] | undefined = undefined;
  if (diskList) {
    const diskArr: CreateInstanceDisk[] = [];
    let counter = 0;
    diskList.forEach(d => {
      if (d.name !== 'cloud-init') {
        const volume = volumes?.find(v => v.name === d.name);
        diskArr.push({
          order: counter,
          cdrom: !!d.cdrom,
          bus: d.disk?.bus || BUS_AUTO.value,
          eid: volume ? extractVolumeEID(volume) : d.name,
        });
        counter++;
      }
    });
    disks = diskArr;
  }

  let labels: string[] | undefined = undefined;
  if (instance.vm?.metadata?.labels) {
    const customLabels: string[] = [];
    for (const [key, value] of Object.entries(instance.vm.metadata.labels)) {
      const label = `${key}:${value}`;
      if (label.startsWith(CUSTOM_USER_LABEL_PREFIX)) {
        customLabels.push(label);
      }
    }
    labels = customLabels;
  }

  const rawCpu = instance.vm?.spec?.template?.spec?.domain?.cpu?.cores;
  const rawMemory = instance.vm?.spec?.template?.spec?.domain?.memory?.guest;

  const payload: UpdateInstance = {
    general: {
      productName: instance.productName ?? instance.eid ?? '',
      runStrategy: (instance.vm?.spec?.runStrategy as RunStrategy) || RunStrategy.Manual,
      vmType: instance.vm?.spec?.preference?.name || VM_TYPE_DEFAULT,
    },
    compute: {
      cpu: rawCpu ? (rawCpu as CpuValue) : CPU_DEFAULT_VALUE,
      memory: rawMemory ? (parseInt(rawMemory, 10) as MemoryValue) : MEMORY_DEFAULT_VALUE,
    },
    network: updatedNetworks,
  };

  if (labels !== undefined) {
    payload.general.labels = labels;
  }

  if (disks !== undefined) {
    payload.disks = disks;
  }

  if (cloudInitConfig !== undefined) {
    payload.cloudInit = {
      config: cloudInitConfig,
      bus: cloudInitBus,
      custom: cloudInitConfig !== DEFAULT_CLOUD_INIT,
    };
  }

  const sshKeys = instance.vm?.spec?.template?.spec?.accessCredentials
    ?.map(v => v.sshPublicKey?.source?.secret?.secretName)
    .filter((key): key is string => !!key);
  if (sshKeys && sshKeys.length > 0) {
    payload.sshKeys = sshKeys;
  }

  if (instance.containerDisks !== undefined) {
    payload.containerDisks = instance.containerDisks;
  }

  const adv = advanced ?? (instance as unknown as { advanced?: AdvancedOptionsInput }).advanced;
  if (adv !== undefined) {
    payload.advanced = adv;
  }

  return payload;
}

export function redirectToParentKaas(router: Router, az: string, instance: ProductInstance) {
  const labels = instance.vm?.metadata?.labels ?? instance.vmi?.metadata?.labels ?? {};
  const rawLocalId = labels[RESOURCE_LOCAL_ID_LABEL_KEY];
  if (!rawLocalId) {
    return;
  }

  const uuidMatch = rawLocalId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (!uuidMatch) {
    return;
  }
  const uuid = uuidMatch[0];

  const { projectId } = getProductLabelInfo(labels);
  if (!projectId) {
    return;
  }

  const effectiveId = 'spx-' + uuidv5(uuid, projectId);
  const url = router.serializeUrl(router.createUrlTree(['/products', 'paas', 'kaas', 'details', az, effectiveId]));
  window.open(url, '_blank');
}

export class InstanceActions {
  static extractNetworksFromInstance = extractNetworksFromInstance;
  static buildUpdatePayloadFromInstance = buildUpdatePayloadFromInstance;
  static parseIp = parseIp;
  static redirectToParentKaas = redirectToParentKaas;
  static async startInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(instanceSvc.startVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid));
    }
  }

  static async stopInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(instanceSvc.stopVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid));
    }
  }

  static async stopForceInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(
        instanceSvc.stopForceVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
      );
    }
  }

  static async restartInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    az: string,
    instance: ProductInstance
  ) {
    if (az && instance.eid) {
      await firstValueFrom(
        instanceSvc.restartVM(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
      );
    }
  }

  static openSerial(stateSvc: StateService, az: string, instance: ProductInstance) {
    window.open(
      `${document.baseURI}terminal/${stateSvc.organization()!.id}/${stateSvc.project()!.id}/${az}/${instance.eid}`,
      '_blank',
      'popup=yes,height=620,width=780'
    );
  }

  static openVNC(stateSvc: StateService, az: string, instance: ProductInstance) {
    window.open(
      `${document.baseURI}vnc/${stateSvc.organization()!.id}/${stateSvc.project()!.id}/${az}/${instance.eid}`,
      '_blank',
      'popup=yes,height=620,width=780'
    );
  }

  static createSnapshot(
    instanceSnapshotSvc: InstanceSnapshotService,
    stateSvc: StateService,
    dialog: MatDialog,
    snackbar: MatSnackBar,
    az: string,
    instance: ProductInstance
  ) {
    const ref = dialog.open(InstanceSnapshotCreateDialogComponent, {
      data: { instance: instance },
    });
    ref.afterClosed().subscribe((res: InstanceSnapshotCreateResultDialog) => {
      if (res && instance.eid) {
        const snapshot = new CreateInstanceSnapshot({
          general: {
            productName: res.name,
            source: instance.eid!,
          },
        });

        firstValueFrom(
          instanceSnapshotSvc.create(stateSvc.organization()!.id, stateSvc.project()!.id, az, snapshot)
        ).then(() => {
          snackbar.open('Snapshot created with success!', undefined, {
            horizontalPosition: 'end',
            duration: 3000,
          });
        });
      }
    });
  }

  static async openArgoCD(instanceSvc: InstanceService, stateSvc: StateService, az: string, instance: ProductInstance) {
    const res = await firstValueFrom(
      instanceSvc.getArgoLink(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid)
    );

    if (res) {
      window.open(res.link, '_blank');
    }
  }

  static deleteInstance(
    instanceSvc: InstanceService,
    stateSvc: StateService,
    dialog: MatDialog,
    az: string,
    instance: ProductInstance
  ): Promise<boolean> {
    if (az && instance.eid) {
      const ref = dialog.open(ConfirmDialog, {
        data: {
          title: `Delete ${instance.productName || instance.eid}`,
          html: `
        <p>Are you sure you want to permanently delete "${instance.productName || instance.eid}"?</p>
        <span class="color-warn"><strong>Warning:</strong> Deleting an instance is permanent and cannot be undone.</span>
        `,
        },
      });
      return new Promise(resolve => {
        ref.afterClosed().subscribe(res => {
          if (res == true) {
            firstValueFrom(
              instanceSvc.delete(stateSvc.organization()!.id, stateSvc.project()!.id, az, instance.eid!)
            ).then(() => resolve(true));
          } else {
            resolve(false);
          }
        });
      });
    }
    return Promise.resolve(false);
  }
}
